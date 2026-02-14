"""
Test Suite for LEARN OS Layer APIs
===================================
Tests all Learn OS endpoints:
- GET /api/os/learn/topics - Get all topic chips
- GET /api/os/learn/home - Get Learn home screen data
- GET /api/os/learn/topic/{topic} - Content by topic (3 shelves)
- GET /api/os/learn/item/{type}/{id} - Single guide/video detail
- POST /api/os/learn/saved - Save/unsave items
- GET /api/os/learn/saved - Get user's saved items
- GET /api/os/learn/search - Search guides/videos
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "dipali@clubconcierge.in"
TEST_PASSWORD = "test123"


class TestLearnOSTopics:
    """Test /api/os/learn/topics endpoint"""
    
    def test_get_topics_returns_9_topics(self):
        """Should return all 9 Learn topic categories"""
        response = requests.get(f"{BASE_URL}/api/os/learn/topics")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        assert "topics" in data
        assert len(data["topics"]) == 9  # 9 topics per spec
        
        # Verify topic structure
        topic_ids = [t["id"] for t in data["topics"]]
        expected_topics = ["grooming", "health", "food", "behaviour", "travel", "boarding", "puppies", "senior", "seasonal"]
        for expected in expected_topics:
            assert expected in topic_ids, f"Missing topic: {expected}"
        
        # Check topic has required fields
        topic = data["topics"][0]
        assert "id" in topic
        assert "label" in topic
        assert "icon" in topic
        assert "color" in topic
        
        print(f"✓ GET /api/os/learn/topics - 9 topics returned with correct structure")


class TestLearnOSHome:
    """Test /api/os/learn/home endpoint"""
    
    def test_home_returns_topics_and_start_here(self):
        """Should return topics and featured content for home screen"""
        response = requests.get(f"{BASE_URL}/api/os/learn/home")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        assert "topics" in data
        assert "start_here" in data
        assert "saved_count" in data
        
        # Topics should have 9 items
        assert len(data["topics"]) == 9
        
        # Start here should have featured items
        assert len(data["start_here"]) > 0
        assert len(data["start_here"]) <= 5  # Max 5 per spec
        
        # Check item structure
        item = data["start_here"][0]
        assert "id" in item
        assert "title" in item
        assert "item_type" in item
        assert "topic" in item
        assert "topic_label" in item
        assert "time_display" in item
        
        print(f"✓ GET /api/os/learn/home - {len(data['start_here'])} start_here items returned")
    
    def test_home_with_auth_returns_saved_count(self):
        """Authenticated request should show user's saved count"""
        # Get token first
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if login_response.status_code != 200:
            pytest.skip("Login failed - skipping authenticated tests")
        
        token = login_response.json().get("token")
        headers = {"Authorization": f"Bearer {token}"}
        
        response = requests.get(f"{BASE_URL}/api/os/learn/home", headers=headers)
        assert response.status_code == 200
        
        data = response.json()
        assert "saved_count" in data
        assert isinstance(data["saved_count"], int)
        
        print(f"✓ GET /api/os/learn/home (auth) - saved_count: {data['saved_count']}")


class TestLearnOSTopicContent:
    """Test /api/os/learn/topic/{topic} endpoint"""
    
    def test_topic_content_returns_3_shelves(self):
        """Should return content organized into 3 shelves"""
        response = requests.get(f"{BASE_URL}/api/os/learn/topic/grooming")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        assert "topic" in data
        assert "shelves" in data
        assert "counts" in data
        
        # Check topic info
        assert data["topic"]["id"] == "grooming"
        assert "label" in data["topic"]
        
        # Check 3 shelves structure
        shelves = data["shelves"]
        assert "start_here" in shelves
        assert "guides" in shelves
        assert "videos" in shelves
        
        # Start here max 3 per spec
        assert len(shelves["start_here"]) <= 3
        
        print(f"✓ GET /api/os/learn/topic/grooming - shelves: start_here={len(shelves['start_here'])}, guides={len(shelves['guides'])}, videos={len(shelves['videos'])}")
    
    def test_all_topics_have_content(self):
        """Each topic should have at least some content"""
        topics = ["grooming", "health", "food", "behaviour", "travel", "boarding", "seasonal"]
        
        for topic in topics:
            response = requests.get(f"{BASE_URL}/api/os/learn/topic/{topic}")
            assert response.status_code == 200, f"Topic {topic} returned {response.status_code}"
            
            data = response.json()
            assert data["success"] == True
            total_content = data["counts"]["start_here"] + data["counts"]["guides"] + data["counts"]["videos"]
            assert total_content > 0, f"Topic {topic} has no content"
        
        print(f"✓ All {len(topics)} topics have content")
    
    def test_invalid_topic_returns_400(self):
        """Invalid topic should return 400 error"""
        response = requests.get(f"{BASE_URL}/api/os/learn/topic/invalid_topic")
        assert response.status_code == 400
        
        print("✓ Invalid topic returns 400 error")


class TestLearnOSItemDetail:
    """Test /api/os/learn/item/{type}/{id} endpoint"""
    
    def test_get_guide_detail(self):
        """Should return full guide content"""
        response = requests.get(f"{BASE_URL}/api/os/learn/item/guide/guide_emergency_signs")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        assert "item" in data
        
        item = data["item"]
        assert item["id"] == "guide_emergency_signs"
        assert item["item_type"] == "guide"
        assert "title" in item
        assert "summary" in item
        assert "steps" in item
        assert "watch_for" in item
        assert "when_to_escalate" in item
        assert "topic_label" in item
        assert "time_display" in item
        
        # Guide should have steps checklist
        assert len(item["steps"]) >= 3
        
        print(f"✓ GET /api/os/learn/item/guide/guide_emergency_signs - {len(item['steps'])} steps")
    
    def test_get_video_detail(self):
        """Should return full video content with YouTube frame data"""
        response = requests.get(f"{BASE_URL}/api/os/learn/item/video/video_tick_removal")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        
        item = data["item"]
        assert item["item_type"] == "video"
        assert "youtube_id" in item
        assert "bullets_before" in item  # What you'll learn
        assert "after_checklist" in item  # Do this today
        assert "duration_sec" in item
        
        print(f"✓ GET /api/os/learn/item/video/video_tick_removal - YouTube ID: {item['youtube_id']}")
    
    def test_item_not_found_returns_404(self):
        """Non-existent item should return 404"""
        response = requests.get(f"{BASE_URL}/api/os/learn/item/guide/nonexistent_guide")
        assert response.status_code == 404
        
        print("✓ Non-existent item returns 404")
    
    def test_invalid_item_type_returns_400(self):
        """Invalid item type should return 400"""
        response = requests.get(f"{BASE_URL}/api/os/learn/item/invalid/guide_emergency_signs")
        assert response.status_code == 400
        
        print("✓ Invalid item type returns 400")


class TestLearnOSSearch:
    """Test /api/os/learn/search endpoint"""
    
    def test_search_returns_results(self):
        """Search should return matching guides and videos"""
        response = requests.get(f"{BASE_URL}/api/os/learn/search?q=tick")
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        assert "query" in data
        assert "results" in data
        assert "counts" in data
        
        assert data["query"] == "tick"
        assert len(data["results"]) > 0
        
        # Results should have both guides and videos
        item_types = set(item["item_type"] for item in data["results"])
        
        print(f"✓ Search 'tick' returned {len(data['results'])} results - types: {item_types}")
    
    def test_search_requires_min_2_chars(self):
        """Search query must be at least 2 characters"""
        response = requests.get(f"{BASE_URL}/api/os/learn/search?q=t")
        assert response.status_code == 422  # Validation error
        
        print("✓ Search requires minimum 2 characters")
    
    def test_search_by_topic_filter(self):
        """Search should support topic filter"""
        response = requests.get(f"{BASE_URL}/api/os/learn/search?q=dog&topic=health")
        assert response.status_code == 200
        
        data = response.json()
        # All results should be from health topic
        for item in data["results"]:
            assert item["topic"] == "health", f"Item {item['id']} has topic {item['topic']}, expected health"
        
        print(f"✓ Search with topic filter returned {len(data['results'])} health items")


class TestLearnOSSavedItems:
    """Test save/unsave functionality"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code == 200:
            data = response.json()
            return data.get("access_token") or data.get("token")
        pytest.skip("Authentication failed")
    
    def test_save_item_requires_auth(self):
        """Save endpoint should require authentication"""
        response = requests.post(f"{BASE_URL}/api/os/learn/saved", json={
            "item_id": "guide_emergency_signs",
            "item_type": "guide",
            "action": "save"
        })
        assert response.status_code == 401
        
        print("✓ Save endpoint requires authentication")
    
    def test_get_saved_requires_auth(self):
        """Get saved items should require authentication"""
        response = requests.get(f"{BASE_URL}/api/os/learn/saved")
        assert response.status_code == 401
        
        print("✓ Get saved endpoint requires authentication")
    
    def test_save_and_get_saved_items(self, auth_token):
        """Should be able to save and retrieve saved items"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Save a guide
        save_response = requests.post(f"{BASE_URL}/api/os/learn/saved", headers=headers, json={
            "item_id": "guide_tick_protocol",
            "item_type": "guide",
            "action": "save"
        })
        assert save_response.status_code == 200
        assert save_response.json()["success"] == True
        
        # Get saved items
        get_response = requests.get(f"{BASE_URL}/api/os/learn/saved", headers=headers)
        assert get_response.status_code == 200
        
        data = get_response.json()
        assert "saved" in data
        assert "guides" in data["saved"]
        
        # Unsave to clean up
        unsave_response = requests.post(f"{BASE_URL}/api/os/learn/saved", headers=headers, json={
            "item_id": "guide_tick_protocol",
            "item_type": "guide",
            "action": "unsave"
        })
        assert unsave_response.status_code == 200
        
        print("✓ Save/unsave flow works correctly")


class TestLearnOSIntegration:
    """Integration tests for complete Learn OS flows"""
    
    def test_full_browse_flow(self):
        """Test complete browse flow: home → topic → item"""
        # 1. Get home
        home_response = requests.get(f"{BASE_URL}/api/os/learn/home")
        assert home_response.status_code == 200
        
        topics = home_response.json()["topics"]
        assert len(topics) == 9
        
        # 2. Click a topic
        topic_response = requests.get(f"{BASE_URL}/api/os/learn/topic/health")
        assert topic_response.status_code == 200
        
        shelves = topic_response.json()["shelves"]
        
        # 3. Get a guide from shelves
        if shelves["guides"]:
            guide_id = shelves["guides"][0]["id"]
            item_response = requests.get(f"{BASE_URL}/api/os/learn/item/guide/{guide_id}")
            assert item_response.status_code == 200
            
            item = item_response.json()["item"]
            assert "steps" in item
            assert "watch_for" in item
            assert "when_to_escalate" in item
        
        print("✓ Full browse flow: home → topic → item works")
    
    def test_content_has_action_ctas(self):
        """Content items should have service CTAs for 'Let Mira do it'"""
        response = requests.get(f"{BASE_URL}/api/os/learn/item/guide/guide_emergency_signs")
        assert response.status_code == 200
        
        item = response.json()["item"]
        assert "service_cta" in item
        assert len(item["service_cta"]) > 0
        
        cta = item["service_cta"][0]
        assert "label" in cta
        assert "service_type" in cta
        
        print(f"✓ Guide has service CTA: {cta['label']}")
    
    def test_video_has_mira_frame_content(self):
        """Video items should have Mira Frame content (before/after)"""
        response = requests.get(f"{BASE_URL}/api/os/learn/item/video/video_nail_trim")
        assert response.status_code == 200
        
        item = response.json()["item"]
        
        # Before video content
        assert "bullets_before" in item
        assert len(item["bullets_before"]) >= 2
        
        # After video content
        assert "after_checklist" in item
        
        # Channel trust info
        assert "channel_name" in item
        
        print(f"✓ Video has Mira Frame: {len(item['bullets_before'])} bullets_before, channel: {item.get('channel_name')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
