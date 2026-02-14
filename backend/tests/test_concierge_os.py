"""
Test Suite for CONCIERGE OS Layer - Backend APIs
=================================================
Tests all Concierge OS endpoints including:
- GET /api/os/concierge/status - Live/offline status
- GET /api/os/concierge/home - Home screen data
- POST /api/os/concierge/thread - Create new thread
- GET /api/os/concierge/thread/{id} - Get thread detail
- POST /api/os/concierge/message - Send message
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test user credentials
TEST_USER_ID = "dipali@clubconcierge.in"
TEST_PET_ID = f"TEST_pet_{uuid.uuid4().hex[:8]}"


class TestConciergeStatus:
    """Test GET /api/os/concierge/status endpoint"""
    
    def test_status_returns_success(self):
        """Test that status endpoint returns success"""
        response = requests.get(f"{BASE_URL}/api/os/concierge/status")
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("success") is True
        
    def test_status_has_required_fields(self):
        """Test that status response has all required fields"""
        response = requests.get(f"{BASE_URL}/api/os/concierge/status")
        assert response.status_code == 200
        
        data = response.json()
        # Check required fields
        assert "is_live" in data
        assert "status_text" in data
        assert "status_color" in data
        assert "message" in data
        
        # Validate data types
        assert isinstance(data["is_live"], bool)
        assert isinstance(data["status_text"], str)
        assert data["status_color"] in ["green", "amber"]
        

class TestConciergeHome:
    """Test GET /api/os/concierge/home endpoint"""
    
    def test_home_requires_user_id(self):
        """Test that home endpoint requires user_id parameter"""
        response = requests.get(f"{BASE_URL}/api/os/concierge/home")
        # Should return 422 (validation error) for missing required param
        assert response.status_code == 422
        
    def test_home_returns_success_with_user_id(self):
        """Test home endpoint with valid user_id"""
        response = requests.get(
            f"{BASE_URL}/api/os/concierge/home",
            params={"user_id": TEST_USER_ID}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("success") is True
        
    def test_home_has_required_fields(self):
        """Test home response structure"""
        response = requests.get(
            f"{BASE_URL}/api/os/concierge/home",
            params={"user_id": TEST_USER_ID}
        )
        assert response.status_code == 200
        
        data = response.json()
        # Check required fields
        assert "status" in data
        assert "suggestion_chips" in data
        assert "active_requests" in data
        assert "recent_threads" in data
        assert "pets" in data
        
        # Status should have live indicator
        assert "is_live" in data["status"]
        assert "status_text" in data["status"]
        
    def test_home_suggestion_chips_structure(self):
        """Test suggestion chips have correct structure"""
        response = requests.get(
            f"{BASE_URL}/api/os/concierge/home",
            params={"user_id": TEST_USER_ID}
        )
        assert response.status_code == 200
        
        data = response.json()
        chips = data.get("suggestion_chips", [])
        
        # Should have at least grooming, boarding, travel, lost_pet
        assert len(chips) >= 4
        
        chip_ids = [c["id"] for c in chips]
        assert "grooming" in chip_ids
        assert "boarding" in chip_ids
        assert "travel" in chip_ids
        assert "lost_pet" in chip_ids
        
        # Each chip should have required fields
        for chip in chips:
            assert "id" in chip
            assert "label" in chip
            assert "icon" in chip
            assert "prefill" in chip
            
    def test_home_with_pet_filter(self):
        """Test home endpoint with pet_id filter"""
        response = requests.get(
            f"{BASE_URL}/api/os/concierge/home",
            params={"user_id": TEST_USER_ID, "pet_id": "all"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("success") is True
        

class TestConciergeThread:
    """Test POST /api/os/concierge/thread endpoint"""
    
    def test_create_thread_basic(self):
        """Test creating a basic concierge thread"""
        payload = {
            "pet_id": TEST_PET_ID,
            "user_id": TEST_USER_ID,
            "intent": "TEST_ I need help with grooming for my pet",
            "source": "concierge_home",
            "suggestion_chip": None
        }
        
        response = requests.post(
            f"{BASE_URL}/api/os/concierge/thread",
            json=payload
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("success") is True
        assert "thread" in data
        assert "messages" in data
        
    def test_create_thread_response_structure(self):
        """Test thread creation returns expected structure"""
        payload = {
            "pet_id": TEST_PET_ID,
            "user_id": TEST_USER_ID,
            "intent": "TEST_ Looking for boarding options",
            "source": "concierge_home",
            "suggestion_chip": "boarding"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/os/concierge/thread",
            json=payload
        )
        assert response.status_code == 200
        
        data = response.json()
        thread = data.get("thread", {})
        
        # Thread structure
        assert "id" in thread
        assert "pet_id" in thread
        assert "user_id" in thread
        assert "title" in thread
        assert "status" in thread
        assert "source" in thread
        assert "created_at" in thread
        
        # Messages structure
        messages = data.get("messages", [])
        assert len(messages) >= 2  # User message + concierge response
        
        # First message is user's intent
        assert messages[0]["sender"] == "user"
        assert "TEST_ Looking for boarding options" in messages[0]["content"]
        
        # Second message is concierge response
        assert messages[1]["sender"] == "concierge"
        
    def test_create_thread_grooming_chip(self):
        """Test thread creation with grooming suggestion chip"""
        payload = {
            "pet_id": TEST_PET_ID,
            "user_id": TEST_USER_ID,
            "intent": "I need grooming help for my pet",
            "source": "concierge_home",
            "suggestion_chip": "grooming"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/os/concierge/thread",
            json=payload
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["thread"]["title"] == "Grooming Help"
        
    def test_create_thread_travel_chip(self):
        """Test thread creation with travel suggestion chip"""
        payload = {
            "pet_id": TEST_PET_ID,
            "user_id": TEST_USER_ID,
            "intent": "I need help planning travel with my pet",
            "source": "concierge_home",
            "suggestion_chip": "travel"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/os/concierge/thread",
            json=payload
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["thread"]["title"] == "Travel Planning"
        
    def test_create_thread_lost_pet_urgent(self):
        """Test that lost_pet chip creates urgent ticket"""
        payload = {
            "pet_id": TEST_PET_ID,
            "user_id": TEST_USER_ID,
            "intent": "TEST_ URGENT - my pet is lost!",
            "source": "concierge_home",
            "suggestion_chip": "lost_pet"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/os/concierge/thread",
            json=payload
        )
        assert response.status_code == 200
        
        data = response.json()
        thread = data.get("thread", {})
        
        # Lost pet should create urgent title
        assert "URGENT" in thread["title"]
        
        # Lost pet should create a ticket
        assert thread.get("ticket_id") is not None
        
        # Concierge response should have urgent status chip
        messages = data.get("messages", [])
        concierge_msg = next((m for m in messages if m["sender"] == "concierge"), None)
        assert concierge_msg is not None
        assert concierge_msg.get("status_chip") == "Urgent"


class TestConciergeThreadDetail:
    """Test GET /api/os/concierge/thread/{id} endpoint"""
    
    @pytest.fixture
    def created_thread(self):
        """Create a thread for testing"""
        payload = {
            "pet_id": TEST_PET_ID,
            "user_id": TEST_USER_ID,
            "intent": "TEST_ Need help with pet grooming appointment",
            "source": "concierge_home",
            "suggestion_chip": None
        }
        response = requests.post(
            f"{BASE_URL}/api/os/concierge/thread",
            json=payload
        )
        data = response.json()
        return data.get("thread", {})
    
    def test_get_thread_requires_user_id(self, created_thread):
        """Test that thread detail requires user_id"""
        thread_id = created_thread.get("id")
        response = requests.get(f"{BASE_URL}/api/os/concierge/thread/{thread_id}")
        # Should return 422 for missing required param
        assert response.status_code == 422
        
    def test_get_thread_success(self, created_thread):
        """Test getting thread detail successfully"""
        thread_id = created_thread.get("id")
        response = requests.get(
            f"{BASE_URL}/api/os/concierge/thread/{thread_id}",
            params={"user_id": TEST_USER_ID}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("success") is True
        assert "thread" in data
        assert "messages" in data
        assert "context_drawer" in data
        
    def test_get_thread_messages_structure(self, created_thread):
        """Test thread detail messages structure"""
        thread_id = created_thread.get("id")
        response = requests.get(
            f"{BASE_URL}/api/os/concierge/thread/{thread_id}",
            params={"user_id": TEST_USER_ID}
        )
        assert response.status_code == 200
        
        data = response.json()
        messages = data.get("messages", [])
        
        # Should have at least 2 messages
        assert len(messages) >= 2
        
        for msg in messages:
            assert "id" in msg
            assert "sender" in msg
            assert "content" in msg
            assert "timestamp" in msg
            
    def test_get_thread_not_found(self):
        """Test 404 for non-existent thread"""
        response = requests.get(
            f"{BASE_URL}/api/os/concierge/thread/nonexistent-thread-id",
            params={"user_id": TEST_USER_ID}
        )
        assert response.status_code == 404
        
    def test_get_thread_wrong_user(self, created_thread):
        """Test that user can't access another user's thread"""
        thread_id = created_thread.get("id")
        response = requests.get(
            f"{BASE_URL}/api/os/concierge/thread/{thread_id}",
            params={"user_id": "wrong-user@test.com"}
        )
        # Should return 404 (not found for this user)
        assert response.status_code == 404


class TestConciergeMessage:
    """Test POST /api/os/concierge/message endpoint"""
    
    @pytest.fixture
    def active_thread(self):
        """Create an active thread for testing"""
        payload = {
            "pet_id": TEST_PET_ID,
            "user_id": TEST_USER_ID,
            "intent": "TEST_ Setting up thread for message testing",
            "source": "concierge_home"
        }
        response = requests.post(
            f"{BASE_URL}/api/os/concierge/thread",
            json=payload
        )
        data = response.json()
        return data.get("thread", {})
    
    def test_send_message_success(self, active_thread):
        """Test sending a message in a thread"""
        thread_id = active_thread.get("id")
        
        payload = {
            "thread_id": thread_id,
            "user_id": TEST_USER_ID,
            "content": "TEST_ This is a follow-up message"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/os/concierge/message",
            json=payload
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("success") is True
        assert "message" in data
        
    def test_send_message_response_structure(self, active_thread):
        """Test message response structure"""
        thread_id = active_thread.get("id")
        
        payload = {
            "thread_id": thread_id,
            "user_id": TEST_USER_ID,
            "content": "TEST_ Testing message structure"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/os/concierge/message",
            json=payload
        )
        assert response.status_code == 200
        
        data = response.json()
        msg = data.get("message", {})
        
        assert "id" in msg
        assert msg["sender"] == "user"
        assert msg["content"] == "TEST_ Testing message structure"
        assert "timestamp" in msg
        
    def test_send_message_verify_persistence(self, active_thread):
        """Test that sent message persists in thread"""
        thread_id = active_thread.get("id")
        
        # Send a message
        message_content = f"TEST_ Persistence test {uuid.uuid4().hex[:6]}"
        payload = {
            "thread_id": thread_id,
            "user_id": TEST_USER_ID,
            "content": message_content
        }
        
        send_response = requests.post(
            f"{BASE_URL}/api/os/concierge/message",
            json=payload
        )
        assert send_response.status_code == 200
        
        # Get thread to verify message is there
        get_response = requests.get(
            f"{BASE_URL}/api/os/concierge/thread/{thread_id}",
            params={"user_id": TEST_USER_ID}
        )
        assert get_response.status_code == 200
        
        data = get_response.json()
        messages = data.get("messages", [])
        
        # Find our message
        found_msg = next((m for m in messages if message_content in m.get("content", "")), None)
        assert found_msg is not None
        
    def test_send_message_thread_not_found(self):
        """Test error when thread doesn't exist"""
        payload = {
            "thread_id": "nonexistent-thread-id",
            "user_id": TEST_USER_ID,
            "content": "TEST_ This should fail"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/os/concierge/message",
            json=payload
        )
        assert response.status_code == 404


class TestConciergeEndToEnd:
    """End-to-end flow tests"""
    
    def test_complete_concierge_flow(self):
        """Test complete flow: status → home → create thread → send message → get thread"""
        
        # 1. Check status
        status_response = requests.get(f"{BASE_URL}/api/os/concierge/status")
        assert status_response.status_code == 200
        print("✓ Status check passed")
        
        # 2. Get home data
        home_response = requests.get(
            f"{BASE_URL}/api/os/concierge/home",
            params={"user_id": TEST_USER_ID}
        )
        assert home_response.status_code == 200
        home_data = home_response.json()
        assert home_data.get("suggestion_chips")
        print("✓ Home data loaded")
        
        # 3. Create a thread (simulating chip click → submit)
        thread_payload = {
            "pet_id": TEST_PET_ID,
            "user_id": TEST_USER_ID,
            "intent": "TEST_ I need boarding for next week",
            "source": "concierge_home",
            "suggestion_chip": "boarding"
        }
        thread_response = requests.post(
            f"{BASE_URL}/api/os/concierge/thread",
            json=thread_payload
        )
        assert thread_response.status_code == 200
        thread_data = thread_response.json()
        thread_id = thread_data["thread"]["id"]
        print(f"✓ Thread created: {thread_id}")
        
        # 4. Send a follow-up message
        message_payload = {
            "thread_id": thread_id,
            "user_id": TEST_USER_ID,
            "content": "TEST_ Can you suggest some options in Bangalore?"
        }
        message_response = requests.post(
            f"{BASE_URL}/api/os/concierge/message",
            json=message_payload
        )
        assert message_response.status_code == 200
        print("✓ Message sent")
        
        # 5. Get thread detail
        detail_response = requests.get(
            f"{BASE_URL}/api/os/concierge/thread/{thread_id}",
            params={"user_id": TEST_USER_ID}
        )
        assert detail_response.status_code == 200
        detail_data = detail_response.json()
        
        # Verify thread has our messages
        messages = detail_data.get("messages", [])
        assert len(messages) >= 3  # Original + concierge response + follow-up
        
        # Verify context drawer
        assert "context_drawer" in detail_data
        print("✓ Thread detail verified")
        
        print("\n✅ End-to-end flow completed successfully!")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
