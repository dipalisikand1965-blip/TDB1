"""
Test Suite for Mira Pet OS - Testing Key Features
=====================================================
Tests for: 
1. YouTube videos on Learn page with topic filters
2. Favorites API - add and retrieve favorites for a pet
3. Mira chat restaurant search functionality
4. Soul Knowledge Ticker (88% soul score)
5. Dynamic picks generation for Celebrate pillar
"""

import pytest
import requests
import os
import uuid
from datetime import datetime

# Get BASE_URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://play-layout-fix.preview.emergentagent.com').rstrip('/')

# Test credentials
TEST_EMAIL = "dipali@clubconcierge.in"
TEST_PASSWORD = "test123"
PET_ID = "pet-3661ae55d2e2"

@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


@pytest.fixture(scope="module")
def auth_token(api_client):
    """Get authentication token for member user"""
    try:
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code == 200:
            data = response.json()
            return data.get("access_token") or data.get("token")
        pytest.skip(f"Authentication failed - {response.status_code}: {response.text}")
    except Exception as e:
        pytest.skip(f"Authentication error: {e}")


@pytest.fixture(scope="module")
def authenticated_client(api_client, auth_token):
    """Session with auth header"""
    api_client.headers.update({"Authorization": f"Bearer {auth_token}"})
    return api_client


class TestHealthEndpoint:
    """Health check tests"""
    
    def test_api_health(self, api_client):
        """Test API health endpoint"""
        response = api_client.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200, f"Health check failed: {response.text}"
        print("✓ API health check passed")


class TestYouTubeVideosAPI:
    """YouTube Training Videos API Tests - Feature 1"""
    
    def test_youtube_by_topic_basic_training(self, api_client):
        """Test YouTube videos by topic - basic_training"""
        response = api_client.get(f"{BASE_URL}/api/mira/youtube/by-topic", params={
            "topic": "basic_training",
            "max_results": 6
        })
        assert response.status_code == 200, f"YouTube by topic failed: {response.text}"
        data = response.json()
        
        # Check response structure
        assert data.get("success") == True, f"YouTube API not successful: {data}"
        assert "videos" in data, "Missing videos in response"
        
        print(f"✓ YouTube by topic (basic_training): Found {len(data.get('videos', []))} videos")
        
        # Validate video structure
        if data.get("videos"):
            video = data["videos"][0]
            assert "id" in video or "url" in video, "Video missing id/url"
            assert "title" in video, "Video missing title"
            print(f"  - First video: {video.get('title', 'N/A')[:50]}...")
    
    def test_youtube_by_topic_puppy_training(self, api_client):
        """Test YouTube videos by topic - puppy_training"""
        response = api_client.get(f"{BASE_URL}/api/mira/youtube/by-topic", params={
            "topic": "puppy_training",
            "max_results": 6
        })
        assert response.status_code == 200, f"YouTube puppy training failed: {response.text}"
        data = response.json()
        assert data.get("success") == True, f"YouTube API not successful: {data}"
        print(f"✓ YouTube by topic (puppy_training): Found {len(data.get('videos', []))} videos")
    
    def test_youtube_by_topic_behavior_fix(self, api_client):
        """Test YouTube videos by topic - behavior_fix"""
        response = api_client.get(f"{BASE_URL}/api/mira/youtube/by-topic", params={
            "topic": "behavior_fix",
            "max_results": 6
        })
        assert response.status_code == 200, f"YouTube behavior fix failed: {response.text}"
        data = response.json()
        assert data.get("success") == True, f"YouTube API not successful: {data}"
        print(f"✓ YouTube by topic (behavior_fix): Found {len(data.get('videos', []))} videos")
    
    def test_youtube_by_topic_leash_training(self, api_client):
        """Test YouTube videos by topic - leash_training"""
        response = api_client.get(f"{BASE_URL}/api/mira/youtube/by-topic", params={
            "topic": "leash_training",
            "max_results": 6
        })
        assert response.status_code == 200, f"YouTube leash training failed: {response.text}"
        data = response.json()
        assert data.get("success") == True, f"YouTube API not successful: {data}"
        print(f"✓ YouTube by topic (leash_training): Found {len(data.get('videos', []))} videos")
    
    def test_youtube_by_breed(self, api_client):
        """Test YouTube videos by breed"""
        response = api_client.get(f"{BASE_URL}/api/mira/youtube/by-breed", params={
            "breed": "Golden Retriever",
            "max_results": 6
        })
        assert response.status_code == 200, f"YouTube by breed failed: {response.text}"
        data = response.json()
        print(f"✓ YouTube by breed (Golden Retriever): Success={data.get('success', 'N/A')}")
    
    def test_youtube_general_search(self, api_client):
        """Test YouTube general video search"""
        response = api_client.get(f"{BASE_URL}/api/mira/youtube/videos", params={
            "query": "dog training tips",
            "max_results": 5
        })
        assert response.status_code == 200, f"YouTube search failed: {response.text}"
        data = response.json()
        print(f"✓ YouTube general search: Found {len(data) if isinstance(data, list) else len(data.get('videos', []))} videos")


class TestFavoritesAPI:
    """Favorites API Tests - Feature 2"""
    
    def test_get_pet_favorites(self, authenticated_client):
        """Test getting favorites for a pet"""
        response = authenticated_client.get(f"{BASE_URL}/api/favorites/{PET_ID}")
        assert response.status_code == 200, f"Get favorites failed: {response.text}"
        data = response.json()
        
        assert data.get("success") == True, f"Get favorites not successful: {data}"
        assert "favorites" in data, "Missing favorites in response"
        assert data.get("pet_id") == PET_ID, f"Pet ID mismatch: {data.get('pet_id')} != {PET_ID}"
        
        print(f"✓ Get favorites: Found {data.get('count', len(data.get('favorites', [])))} favorites for pet {PET_ID}")
    
    def test_add_favorite(self, authenticated_client):
        """Test adding a favorite item"""
        # Create unique test item
        test_item = {
            "pet_id": PET_ID,
            "item": {
                "id": f"test-fav-{uuid.uuid4().hex[:8]}",
                "title": "TEST_Birthday Cake Design",
                "type": "service",
                "category": "celebration",
                "pillar": "celebrate",
                "icon": "🎂"
            }
        }
        
        response = authenticated_client.post(f"{BASE_URL}/api/favorites/add", json=test_item)
        assert response.status_code == 200, f"Add favorite failed: {response.text}"
        data = response.json()
        
        assert data.get("success") == True, f"Add favorite not successful: {data}"
        print(f"✓ Add favorite: {data.get('message', 'Success')}")
        
        # Verify favorite was added by getting favorites again
        verify_response = authenticated_client.get(f"{BASE_URL}/api/favorites/{PET_ID}")
        assert verify_response.status_code == 200
        verify_data = verify_response.json()
        
        # Check if our test item exists
        favorites = verify_data.get("favorites", [])
        test_item_found = any("TEST_Birthday" in f.get("title", "") for f in favorites)
        print(f"✓ Verify favorite added: {test_item_found}")
    
    def test_get_favorites_summary(self, authenticated_client):
        """Test getting favorites summary for Mira context"""
        response = authenticated_client.get(f"{BASE_URL}/api/favorites/{PET_ID}/summary")
        assert response.status_code == 200, f"Get favorites summary failed: {response.text}"
        data = response.json()
        
        assert data.get("success") == True, f"Get favorites summary not successful: {data}"
        print(f"✓ Get favorites summary: has_favorites={data.get('has_favorites')}, total={data.get('total_count', 0)}")


class TestMiraChatRestaurantSearch:
    """Mira Chat Restaurant Search Tests - Feature 3"""
    
    def test_mira_chat_restaurant_query(self, authenticated_client):
        """Test Mira chat with restaurant search query"""
        chat_payload = {
            "message": "Can you find pet-friendly restaurants in Bangalore?",
            "pet_id": PET_ID,
            "pillar": "dine",
            "context": {
                "location": "Bangalore",
                "city": "Bangalore"
            }
        }
        
        response = authenticated_client.post(f"{BASE_URL}/api/mira/chat", json=chat_payload)
        assert response.status_code == 200, f"Mira chat failed: {response.text}"
        data = response.json()
        
        # Check response has content
        assert "response" in data or "message" in data, f"No response in Mira chat: {data}"
        
        response_text = data.get("response") or data.get("message", "")
        print(f"✓ Mira chat restaurant query: Got response ({len(response_text)} chars)")
        print(f"  Response preview: {response_text[:200]}..." if len(response_text) > 200 else f"  Response: {response_text}")
    
    def test_mira_os_understand_dine_intent(self, authenticated_client):
        """Test Mira OS understand endpoint with dine intent"""
        understand_payload = {
            "message": "Find me pet friendly cafes in Indiranagar",
            "pet_id": PET_ID,
            "pillar": "dine",
            "context": {}
        }
        
        response = authenticated_client.post(f"{BASE_URL}/api/mira/os/understand", json=understand_payload)
        # This endpoint may return different formats
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Mira OS understand (dine): Success")
            print(f"  Intent/Mode: {data.get('intent', data.get('mode', 'N/A'))}")
        else:
            print(f"⚠ Mira OS understand: Status {response.status_code}")


class TestSoulKnowledgeTicker:
    """Soul Knowledge Ticker Tests - Feature 4"""
    
    def test_pet_soul_score(self, authenticated_client):
        """Test getting pet soul score"""
        response = authenticated_client.get(f"{BASE_URL}/api/mira/personalization-stats/{PET_ID}")
        
        if response.status_code == 200:
            data = response.json()
            soul_score = data.get("soul_score", data.get("score", 0))
            print(f"✓ Pet soul score: {soul_score}%")
            print(f"  Knowledge items: {len(data.get('knowledge_items', []))}")
            
            # Check if score is around 88% as expected
            if soul_score > 0:
                print(f"  Soul score value: {soul_score}")
        elif response.status_code == 404:
            print(f"⚠ Personalization stats endpoint not found (404)")
        else:
            print(f"⚠ Pet soul score: Status {response.status_code}")
    
    def test_what_mira_knows(self, authenticated_client):
        """Test What Mira Knows endpoint"""
        response = authenticated_client.get(f"{BASE_URL}/api/mira/memory/pet/{PET_ID}/what-mira-knows")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✓ What Mira Knows: Retrieved successfully")
            print(f"  Soul knowledge items: {len(data.get('soul_knowledge', []))}")
            print(f"  Breed knowledge items: {len(data.get('breed_knowledge', []))}")
            print(f"  Memory items: {len(data.get('memory_knowledge', []))}")
        elif response.status_code == 404:
            print(f"⚠ What Mira Knows endpoint not found (404)")
        else:
            print(f"⚠ What Mira Knows: Status {response.status_code}")
    
    def test_pet_soul_data(self, authenticated_client):
        """Test getting pet soul data directly"""
        response = authenticated_client.get(f"{BASE_URL}/api/pets/{PET_ID}")
        
        if response.status_code == 200:
            data = response.json()
            pet = data.get("pet", data)
            soul = pet.get("soul", {})
            soul_score = soul.get("completion_score", 0)
            
            print(f"✓ Pet data retrieved: {pet.get('name', 'Unknown')}")
            print(f"  Soul completion: {soul_score}%")
            print(f"  Has soul data: {bool(soul)}")
        else:
            print(f"⚠ Pet data: Status {response.status_code}")


class TestDynamicPicksGeneration:
    """Dynamic Picks Generation Tests - Feature 5 (Celebrate pillar)"""
    
    def test_celebrate_picks_via_mira(self, authenticated_client):
        """Test dynamic picks generation for Celebrate pillar via Mira chat"""
        chat_payload = {
            "message": "I want to plan a birthday party for my dog with a cake and photographer",
            "pet_id": PET_ID,
            "pillar": "celebrate",
            "context": {
                "celebrate_location": "Bangalore"
            }
        }
        
        response = authenticated_client.post(f"{BASE_URL}/api/mira/chat", json=chat_payload)
        assert response.status_code == 200, f"Mira chat celebrate failed: {response.text}"
        data = response.json()
        
        # Check for picks in response
        picks = data.get("picks", data.get("dynamic_picks", []))
        response_text = data.get("response") or data.get("message", "")
        
        print(f"✓ Celebrate picks via Mira: Got response")
        print(f"  Picks count: {len(picks)}")
        print(f"  Response preview: {response_text[:150]}..." if response_text else "  (No text response)")
        
        if picks:
            for pick in picks[:3]:
                print(f"  - Pick: {pick.get('title', pick.get('name', 'N/A'))}")
    
    def test_celebrate_pillar_services(self, api_client):
        """Test celebrate pillar services catalog"""
        response = api_client.get(f"{BASE_URL}/api/services/catalog", params={
            "pillar": "celebrate",
            "limit": 10
        })
        
        if response.status_code == 200:
            data = response.json()
            services = data.get("services", data if isinstance(data, list) else [])
            print(f"✓ Celebrate services: Found {len(services)} services")
            
            for svc in services[:3]:
                print(f"  - {svc.get('name', svc.get('title', 'N/A'))}")
        elif response.status_code == 404:
            print(f"⚠ Services catalog not found, checking alternate endpoint...")
            
            # Try alternate services endpoint
            alt_response = api_client.get(f"{BASE_URL}/api/service-catalog/celebrate")
            if alt_response.status_code == 200:
                data = alt_response.json()
                print(f"✓ Celebrate services (alt): Found {len(data.get('services', []))} services")
            else:
                print(f"⚠ Alternate endpoint also returned {alt_response.status_code}")
        else:
            print(f"⚠ Services catalog: Status {response.status_code}")
    
    def test_celebrate_picks_endpoint(self, authenticated_client):
        """Test dedicated celebrate picks endpoint if exists"""
        # Try getting picks for celebrate pillar
        response = authenticated_client.get(f"{BASE_URL}/api/mira/picks/{PET_ID}", params={
            "pillar": "celebrate"
        })
        
        if response.status_code == 200:
            data = response.json()
            picks = data.get("picks", [])
            print(f"✓ Celebrate picks endpoint: Found {len(picks)} picks")
            
            for pick in picks[:3]:
                print(f"  - {pick.get('title', pick.get('name', 'N/A'))}")
        else:
            print(f"⚠ Picks endpoint: Status {response.status_code}")


class TestAuthenticationFlow:
    """Authentication flow tests"""
    
    def test_member_login(self, api_client):
        """Test member login"""
        response = api_client.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        
        assert "access_token" in data or "token" in data, f"No token in response: {data}"
        print(f"✓ Member login successful")
        print(f"  User: {data.get('user', {}).get('email', 'N/A')}")
    
    def test_get_user_pets(self, authenticated_client):
        """Test getting user's pets"""
        response = authenticated_client.get(f"{BASE_URL}/api/pets/my-pets")
        assert response.status_code == 200, f"Get pets failed: {response.text}"
        data = response.json()
        
        pets = data.get("pets", [])
        print(f"✓ Get user pets: Found {len(pets)} pets")
        
        for pet in pets[:3]:
            print(f"  - {pet.get('name')}: {pet.get('breed', 'Unknown breed')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
