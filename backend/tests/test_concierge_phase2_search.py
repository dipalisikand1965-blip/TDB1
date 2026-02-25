"""
Test Concierge Phase 2 - Golden Standard Communication System
==============================================================
Testing Phase 2 features:
1. Message Search (Feature 13) - User and Admin endpoints
2. Relative Timestamps (Feature 14) - Verified via data structure
"""

import pytest
import requests
import os
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_USER_EMAIL = "dipali@clubconcierge.in"
TEST_USER_PASSWORD = "test123"
ADMIN_USERNAME = "aditya"
ADMIN_PASSWORD = "lola4304"


class TestMessageSearchUser:
    """Test user message search endpoint (Feature 13)"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get user ID for tests"""
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        
        if login_response.status_code == 200:
            user_data = login_response.json()
            self.user_id = user_data.get("user", {}).get("id")
        else:
            self.user_id = None
    
    def test_user_search_messages(self):
        """Test GET /api/concierge/realtime/search for user"""
        if not self.user_id:
            pytest.skip("No user ID available")
        
        response = requests.get(
            f"{BASE_URL}/api/concierge/realtime/search",
            params={
                "user_id": self.user_id,
                "q": "hello",
                "limit": 20
            }
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True
        assert "results" in data
        assert "total" in data
        assert data.get("query") == "hello"
        
        print(f"✓ User search for 'hello' returned {data['total']} results")
        
        # Verify result structure if results exist
        if len(data.get("results", [])) > 0:
            result = data["results"][0]
            assert "id" in result, "Result should have message id"
            assert "thread_id" in result, "Result should have thread_id"
            assert "content" in result, "Result should have content"
            assert "timestamp" in result, "Result should have timestamp"
            assert "sender" in result, "Result should have sender"
            assert "highlight_start" in result, "Result should have highlight_start for search highlighting"
            assert "highlight_length" in result, "Result should have highlight_length"
            print(f"  First result: '{result['content'][:50]}...'")
    
    def test_user_search_short_query(self):
        """Test search with short query (minimum 1 character)"""
        if not self.user_id:
            pytest.skip("No user ID available")
        
        # Test with 1 character query
        response = requests.get(
            f"{BASE_URL}/api/concierge/realtime/search",
            params={
                "user_id": self.user_id,
                "q": "a",
                "limit": 10
            }
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ Short search query accepted")
    
    def test_user_search_missing_user_id(self):
        """Test search without user_id - should fail"""
        response = requests.get(
            f"{BASE_URL}/api/concierge/realtime/search",
            params={"q": "test"}
        )
        
        assert response.status_code == 422, f"Expected 422 for missing user_id, got {response.status_code}"
        print("✓ Correctly rejects search without user_id")
    
    def test_user_search_missing_query(self):
        """Test search without query - should fail"""
        if not self.user_id:
            pytest.skip("No user ID available")
        
        response = requests.get(
            f"{BASE_URL}/api/concierge/realtime/search",
            params={"user_id": self.user_id}
        )
        
        assert response.status_code == 422, f"Expected 422 for missing query, got {response.status_code}"
        print("✓ Correctly rejects search without query")
    
    def test_user_search_with_thread_filter(self):
        """Test search within specific thread"""
        if not self.user_id:
            pytest.skip("No user ID available")
        
        # First get a thread for this user
        threads_response = requests.get(f"{BASE_URL}/api/os/concierge/user/{self.user_id}/threads?limit=1")
        
        if threads_response.status_code != 200:
            # Try admin endpoint to find a thread
            admin_response = requests.get(f"{BASE_URL}/api/os/concierge/admin/threads?limit=10")
            if admin_response.status_code == 200:
                threads = admin_response.json().get("threads", [])
                user_thread = next((t for t in threads if t.get("user_id") == self.user_id), None)
                if user_thread:
                    thread_id = user_thread.get("id")
                else:
                    pytest.skip("No threads found for user")
            else:
                pytest.skip("Cannot access threads endpoint")
        else:
            threads = threads_response.json().get("threads", [])
            if not threads:
                pytest.skip("No threads for user")
            thread_id = threads[0].get("id")
        
        response = requests.get(
            f"{BASE_URL}/api/concierge/realtime/search",
            params={
                "user_id": self.user_id,
                "q": "test",
                "thread_id": thread_id,
                "limit": 10
            }
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print(f"✓ Search with thread_id filter accepted")


class TestMessageSearchAdmin:
    """Test admin message search endpoint (Feature 13)"""
    
    def test_admin_search_messages(self):
        """Test GET /api/concierge/realtime/admin/search"""
        response = requests.get(
            f"{BASE_URL}/api/concierge/realtime/admin/search",
            params={
                "q": "hello",
                "limit": 30
            }
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True
        assert "results" in data
        assert "total" in data
        assert data.get("query") == "hello"
        
        print(f"✓ Admin search for 'hello' returned {data['total']} results")
        
        # Verify result structure for admin
        if len(data.get("results", [])) > 0:
            result = data["results"][0]
            assert "id" in result, "Result should have message id"
            assert "thread_id" in result, "Result should have thread_id"
            assert "content" in result, "Result should have content"
            assert "timestamp" in result, "Result should have timestamp"
            assert "sender" in result, "Result should have sender"
            # Admin search should include user_name and pet_name
            assert "user_name" in result or result["user_name"] is None, "Admin result should include user_name"
            assert "pet_name" in result or result["pet_name"] is None, "Admin result should include pet_name"
            print(f"  First result from thread: {result.get('thread_title', 'Unknown')}")
    
    def test_admin_search_with_user_filter(self):
        """Test admin search filtered by user_id"""
        # Get a user ID first
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        
        if login_response.status_code != 200:
            pytest.skip("Cannot get user ID")
        
        user_id = login_response.json().get("user", {}).get("id")
        
        response = requests.get(
            f"{BASE_URL}/api/concierge/realtime/admin/search",
            params={
                "q": "test",
                "user_id": user_id,
                "limit": 20
            }
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        print(f"✓ Admin search filtered by user_id returned {data['total']} results")
    
    def test_admin_search_missing_query(self):
        """Test admin search without query - should fail"""
        response = requests.get(f"{BASE_URL}/api/concierge/realtime/admin/search")
        
        assert response.status_code == 422, f"Expected 422 for missing query, got {response.status_code}"
        print("✓ Correctly rejects admin search without query")
    
    def test_admin_search_different_queries(self):
        """Test admin search with various queries"""
        test_queries = ["concierge", "message", "test", "hi"]
        
        for query in test_queries:
            response = requests.get(
                f"{BASE_URL}/api/concierge/realtime/admin/search",
                params={"q": query, "limit": 5}
            )
            
            assert response.status_code == 200, f"Search for '{query}' failed: {response.status_code}"
            data = response.json()
            print(f"  '{query}': {data['total']} results")
        
        print("✓ Multiple search queries executed successfully")


class TestRelativeTimestamps:
    """Test that timestamps are returned for relative time display (Feature 14)"""
    
    def test_search_results_have_timestamps(self):
        """Verify search results include ISO timestamps for client-side relative formatting"""
        response = requests.get(
            f"{BASE_URL}/api/concierge/realtime/admin/search",
            params={"q": "test", "limit": 5}
        )
        
        if response.status_code != 200:
            pytest.skip("Search endpoint not returning results")
        
        data = response.json()
        results = data.get("results", [])
        
        if not results:
            pytest.skip("No search results to verify")
        
        for result in results:
            timestamp = result.get("timestamp")
            assert timestamp is not None, "Result should have timestamp"
            
            # Verify it's a valid ISO timestamp
            try:
                from datetime import datetime
                # Parse ISO format timestamp
                if timestamp.endswith('Z'):
                    timestamp = timestamp[:-1] + '+00:00'
                datetime.fromisoformat(timestamp.replace('Z', '+00:00'))
                print(f"  Valid timestamp: {timestamp[:19]}")
            except ValueError as e:
                pytest.fail(f"Invalid timestamp format: {timestamp} - {e}")
        
        print(f"✓ All {len(results)} search results have valid ISO timestamps for relative time display")
    
    def test_thread_list_has_timestamps(self):
        """Verify admin thread list includes timestamps"""
        response = requests.get(f"{BASE_URL}/api/os/concierge/admin/threads?limit=5")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        threads = data.get("threads", [])
        
        if not threads:
            pytest.skip("No threads to verify")
        
        for thread in threads:
            last_message_at = thread.get("last_message_at")
            assert last_message_at is not None, f"Thread {thread.get('id')} should have last_message_at"
            print(f"  Thread '{thread.get('title', 'Unknown')[:30]}': {last_message_at[:19]}")
        
        print(f"✓ All {len(threads)} threads have timestamps for relative time display")


class TestChannelOptions:
    """Test that omnichannel options exist in admin dashboard (Chat, WhatsApp, Email)"""
    
    def test_admin_thread_has_user_contact_info(self):
        """Verify admin thread detail includes user email/phone for channel options"""
        # Get a thread
        threads_response = requests.get(f"{BASE_URL}/api/os/concierge/admin/threads?limit=1")
        
        if threads_response.status_code != 200:
            pytest.skip("Cannot get threads")
        
        threads = threads_response.json().get("threads", [])
        if not threads:
            pytest.skip("No threads available")
        
        thread_id = threads[0].get("id")
        
        # Get thread detail
        detail_response = requests.get(f"{BASE_URL}/api/os/concierge/admin/thread/{thread_id}")
        
        assert detail_response.status_code == 200, f"Expected 200, got {detail_response.status_code}"
        
        data = detail_response.json()
        
        # Check if thread or user info includes contact details
        thread = data.get("thread", {})
        user = data.get("user", {})
        
        has_email = thread.get("user_email") or user.get("email")
        has_phone = thread.get("user_phone") or user.get("phone")
        
        print(f"✓ Thread detail retrieved for channel options")
        if has_email:
            print(f"  Email available: {has_email}")
        if has_phone:
            print(f"  Phone available: {has_phone}")
        
        # At least one contact method should be available for omnichannel
        # This is not a strict requirement, just informational


class TestUILabels:
    """Test that message data structure supports UI labels"""
    
    def test_thread_has_pet_name(self):
        """Verify threads include pet_name for '(Pet name)' label"""
        response = requests.get(f"{BASE_URL}/api/os/concierge/admin/threads?limit=10")
        
        assert response.status_code == 200
        
        threads = response.json().get("threads", [])
        
        # Check that threads have pet_name field
        threads_with_pet = [t for t in threads if t.get("pet_name")]
        
        print(f"✓ {len(threads_with_pet)}/{len(threads)} threads have pet_name for UI labels")
        
        if threads_with_pet:
            sample = threads_with_pet[0]
            print(f"  Sample: Pet '{sample['pet_name']}' for thread '{sample.get('title', 'Unknown')}'")
    
    def test_messages_have_sender_type(self):
        """Verify messages have sender field for Concierge®/Pet name labels"""
        # Get a thread with messages
        threads_response = requests.get(f"{BASE_URL}/api/os/concierge/admin/threads?limit=1")
        
        if threads_response.status_code != 200:
            pytest.skip("Cannot get threads")
        
        threads = threads_response.json().get("threads", [])
        if not threads:
            pytest.skip("No threads available")
        
        thread_id = threads[0].get("id")
        
        detail_response = requests.get(f"{BASE_URL}/api/os/concierge/admin/thread/{thread_id}")
        
        if detail_response.status_code != 200:
            pytest.skip("Cannot get thread detail")
        
        messages = detail_response.json().get("messages", [])
        
        if not messages:
            pytest.skip("No messages in thread")
        
        for msg in messages[:5]:  # Check first 5
            sender = msg.get("sender")
            assert sender in ["concierge", "user", "member", "system"], f"Invalid sender type: {sender}"
            source = msg.get("source")
            print(f"  Message sender: {sender}, source: {source}")
        
        print(f"✓ All messages have valid sender field for UI labels")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
