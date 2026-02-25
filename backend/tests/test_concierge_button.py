"""
Test suite for Concierge Button API endpoints
Tests GET/POST /api/os/concierge/threads
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestConciergeOSThreads:
    """Tests for ConciergeButton thread API endpoints"""
    
    def test_get_concierge_status(self):
        """Test GET /api/os/concierge/status returns live status"""
        response = requests.get(f"{BASE_URL}/api/os/concierge/status")
        assert response.status_code == 200
        
        data = response.json()
        assert data.get('success') == True
        assert 'is_live' in data
        assert 'status_text' in data
        assert 'status_color' in data
        print(f"Concierge status: {data.get('status_text')}")
    
    def test_get_threads_empty_user(self):
        """Test GET /api/os/concierge/threads returns empty list for new user"""
        response = requests.get(
            f"{BASE_URL}/api/os/concierge/threads",
            params={"user_id": "test_nonexistent_user", "limit": 5}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert 'threads' in data
        assert data.get('total') == 0
    
    def test_get_threads_with_status_filter(self):
        """Test GET /api/os/concierge/threads with status filter"""
        response = requests.get(
            f"{BASE_URL}/api/os/concierge/threads",
            params={"user_id": "test_user", "status": "open", "limit": 5}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert 'threads' in data
        assert isinstance(data['threads'], list)
    
    def test_create_simple_thread(self):
        """Test POST /api/os/concierge/threads creates a new thread"""
        payload = {
            "user_id": "TEST_user_concierge_button",
            "pet_name": "TestDog",
            "source": "test_concierge_button",
            "title": "Test Chat"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/os/concierge/threads",
            json=payload
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data.get('success') == True
        assert 'thread' in data
        
        thread = data['thread']
        assert 'id' in thread
        assert thread.get('pet_name') == 'TestDog'
        assert thread.get('status') == 'active'
        print(f"Created thread: {thread.get('id')}")
        
        return thread['id']
    
    def test_create_thread_and_verify_persistence(self):
        """Test thread creation and verify it persists via GET"""
        # Create thread
        create_payload = {
            "user_id": "TEST_persistence_user",
            "pet_name": "PersistDog",
            "source": "test_persistence"
        }
        
        create_response = requests.post(
            f"{BASE_URL}/api/os/concierge/threads",
            json=create_payload
        )
        assert create_response.status_code == 200
        thread_id = create_response.json()['thread']['id']
        
        # Verify via GET
        get_response = requests.get(
            f"{BASE_URL}/api/os/concierge/threads",
            params={"user_id": "TEST_persistence_user", "limit": 10}
        )
        assert get_response.status_code == 200
        
        threads = get_response.json()['threads']
        thread_ids = [t['id'] for t in threads]
        assert thread_id in thread_ids, f"Created thread {thread_id} not found in GET response"
        
        # Verify thread data
        found_thread = next(t for t in threads if t['id'] == thread_id)
        assert found_thread['pet_name'] == 'PersistDog'
        assert found_thread['source'] == 'test_persistence'
    
    def test_create_thread_without_pet_id(self):
        """Test thread creation without pet_id (optional field)"""
        payload = {
            "user_id": "TEST_user_no_pet",
            "pet_name": "GenericPet",
            "source": "pillar_celebrate"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/os/concierge/threads",
            json=payload
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data.get('success') == True
        assert data['thread'].get('pet_id') is None


class TestConciergeHome:
    """Tests for concierge home endpoint"""
    
    def test_get_concierge_home(self):
        """Test GET /api/os/concierge/home returns home data"""
        response = requests.get(
            f"{BASE_URL}/api/os/concierge/home",
            params={"user_id": "test_user"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data.get('success') == True
        assert 'status' in data
        assert 'suggestion_chips' in data
        assert 'active_requests' in data
        assert 'recent_threads' in data


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
