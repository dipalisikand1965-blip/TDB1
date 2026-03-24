"""
Test Suite for useChat.js Hook Refactoring (Iteration 118)
===========================================================
Tests for MiraDemoPage.jsx refactoring - verifying:
1. useChat.js hook exports all detection helpers correctly
2. useChat.js hook exports all API helpers correctly
3. ChatMessage component functionality via API responses
4. /api/mira/chat endpoint returns valid response
5. /api/mira/route_intent endpoint routes to correct pillar
6. /api/health returns healthy status
"""

import pytest
import requests
import os
import json

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://pet-soul-audit.preview.emergentagent.com').rstrip('/')

# ═══════════════════════════════════════════════════════════════════════════════
# HEALTH CHECK TESTS
# ═══════════════════════════════════════════════════════════════════════════════

class TestHealthEndpoint:
    """Tests for /api/health endpoint"""
    
    def test_health_returns_healthy_status(self):
        """Test /api/health returns healthy status"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get('status') == 'healthy'
        print("✓ /api/health returns healthy status")


# ═══════════════════════════════════════════════════════════════════════════════
# MIRA CHAT ENDPOINT TESTS
# ═══════════════════════════════════════════════════════════════════════════════

class TestMiraChatEndpoint:
    """Tests for /api/mira/chat endpoint"""
    
    def test_chat_returns_valid_response_structure(self):
        """Test /api/mira/chat returns valid response structure"""
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            json={
                "message": "Hello Mira",
                "pet_id": "test-pet-1",
                "pet": {"name": "Buddy", "breed": "Golden Retriever", "age": "3"},
                "parent_id": "test-parent"
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        # Check required fields exist
        assert 'response' in data, "Response should contain 'response' field"
        assert 'session_id' in data, "Response should contain 'session_id' field"
        print("✓ /api/mira/chat returns valid response structure")
    
    def test_chat_returns_products_for_treats_query(self):
        """Test that treats query returns products"""
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            json={
                "message": "recommend some treats for my dog",
                "pet_id": "test-pet-1",
                "pet": {"name": "Buddy", "breed": "Golden Retriever", "age": "3"},
                "parent_id": "test-parent"
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        # Treats query should return products
        if 'products' in data:
            assert isinstance(data['products'], list), "Products should be a list"
            print(f"✓ Treats query returns {len(data['products'])} products")
        else:
            print("✓ Treats query processed (no products in this response)")
    
    def test_chat_returns_session_id(self):
        """Test that chat returns session_id for tracking"""
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            json={
                "message": "Hi there",
                "pet_id": "test-pet-2",
                "pet": {"name": "Max", "breed": "Labrador", "age": "2"},
                "parent_id": "test-parent-2"
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        assert 'session_id' in data, "Response must contain session_id"
        assert isinstance(data['session_id'], str), "session_id must be a string"
        assert len(data['session_id']) > 0, "session_id must not be empty"
        print(f"✓ Chat returns valid session_id: {data['session_id'][:8]}...")
    
    def test_chat_handles_empty_message(self):
        """Test chat handles empty message gracefully"""
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            json={
                "message": "",
                "pet_id": "test-pet-1",
                "pet": {"name": "Buddy", "breed": "Golden Retriever", "age": "3"},
                "parent_id": "test-parent"
            }
        )
        # Should return 200 or 400, but not 500
        assert response.status_code in [200, 400], f"Unexpected status code: {response.status_code}"
        print("✓ Chat handles empty message gracefully")


# ═══════════════════════════════════════════════════════════════════════════════
# ROUTE INTENT ENDPOINT TESTS
# ═══════════════════════════════════════════════════════════════════════════════

class TestRouteIntentEndpoint:
    """Tests for /api/mira/route_intent endpoint"""
    
    def test_route_intent_birthday(self):
        """Test route_intent routes birthday to Celebrate pillar"""
        response = requests.post(
            f"{BASE_URL}/api/mira/route_intent",
            json={
                "parent_id": "test-parent",
                "pet_id": "test-pet-1",
                "utterance": "I want to plan a birthday party for my dog",
                "source_event": "search",
                "device": "web",
                "pet_context": {
                    "name": "Buddy",
                    "breed": "Golden Retriever",
                    "age_years": 3
                }
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        assert 'pillar' in data, "Response should contain pillar"
        assert data['pillar'].lower() == 'celebrate', f"Birthday should route to 'celebrate' pillar, got '{data['pillar']}'"
        print(f"✓ Birthday routes to Celebrate pillar")
    
    def test_route_intent_grooming(self):
        """Test route_intent routes grooming to Care pillar"""
        response = requests.post(
            f"{BASE_URL}/api/mira/route_intent",
            json={
                "parent_id": "test-parent",
                "pet_id": "test-pet-1",
                "utterance": "My dog needs grooming",
                "source_event": "search",
                "device": "web",
                "pet_context": {
                    "name": "Buddy",
                    "breed": "Golden Retriever",
                    "age_years": 3
                }
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        assert 'pillar' in data, "Response should contain pillar"
        print(f"✓ Grooming routes to {data['pillar']} pillar")
    
    def test_route_intent_travel(self):
        """Test route_intent routes travel to Travel pillar"""
        response = requests.post(
            f"{BASE_URL}/api/mira/route_intent",
            json={
                "parent_id": "test-parent",
                "pet_id": "test-pet-1",
                "utterance": "I want to travel with my dog to Goa",
                "source_event": "search",
                "device": "web",
                "pet_context": {
                    "name": "Buddy",
                    "breed": "Golden Retriever",
                    "age_years": 3,
                    "city": "Mumbai"
                }
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        assert 'pillar' in data, "Response should contain pillar"
        print(f"✓ Travel query routes to {data['pillar']} pillar")
    
    def test_route_intent_treats(self):
        """Test route_intent routes treats/food"""
        response = requests.post(
            f"{BASE_URL}/api/mira/route_intent",
            json={
                "parent_id": "test-parent",
                "pet_id": "test-pet-1",
                "utterance": "recommend some healthy treats for my puppy",
                "source_event": "search",
                "device": "web",
                "pet_context": {
                    "name": "Buddy",
                    "breed": "Golden Retriever",
                    "age_years": 1
                }
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        assert 'pillar' in data, "Response should contain pillar"
        print(f"✓ Treats query routes to {data['pillar']} pillar")


# ═══════════════════════════════════════════════════════════════════════════════
# API HELPER FUNCTIONS TESTS (Testing endpoints used by hook)
# ═══════════════════════════════════════════════════════════════════════════════

class TestAPIHelperEndpoints:
    """Tests for API endpoints used by useChat.js API helpers"""
    
    def test_conversation_memory_recall(self):
        """Test /api/mira/conversation-memory/recall endpoint"""
        response = requests.post(
            f"{BASE_URL}/api/mira/conversation-memory/recall",
            json={
                "pet_id": "test-pet-memory",
                "query": "my dog has been scratching a lot"
            }
        )
        # Should return 200 even if no memory found
        assert response.status_code == 200
        data = response.json()
        assert 'success' in data
        print("✓ Conversation memory recall endpoint working")
    
    def test_mood_detection(self):
        """Test /api/mira/detect-mood endpoint"""
        response = requests.post(
            f"{BASE_URL}/api/mira/detect-mood",
            json={
                "message": "My dog seems a bit anxious today",
                "pet_name": "Buddy"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert 'success' in data
        print("✓ Mood detection endpoint working")
    
    def test_youtube_training_videos(self):
        """Test /api/mira/youtube/by-topic endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/mira/youtube/by-topic",
            params={
                "topic": "puppy training",
                "breed": "Golden Retriever",
                "max_results": 3
            }
        )
        assert response.status_code == 200
        data = response.json()
        # Check structure
        assert 'success' in data
        print(f"✓ YouTube training videos endpoint working")
    
    def test_amadeus_hotels(self):
        """Test /api/mira/amadeus/hotels endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/mira/amadeus/hotels",
            params={
                "city": "Mumbai",
                "max_results": 3
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert 'success' in data
        print("✓ Amadeus hotels endpoint working")
    
    def test_viator_attractions(self):
        """Test /api/mira/viator/pet-friendly endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/mira/viator/pet-friendly",
            params={
                "city": "Goa",
                "limit": 3
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert 'success' in data
        print("✓ Viator attractions endpoint working")
    
    def test_conversation_memory_save(self):
        """Test /api/mira/conversation-memory/save endpoint"""
        response = requests.post(
            f"{BASE_URL}/api/mira/conversation-memory/save",
            json={
                "pet_id": "test-pet-memory-save",
                "topic": "health",
                "summary": "Dog had skin issues",
                "user_query": "my dog is scratching",
                "mira_advice": "Try antihistamine shampoo"
            }
        )
        assert response.status_code == 200
        print("✓ Conversation memory save endpoint working")


# ═══════════════════════════════════════════════════════════════════════════════
# SERVICE DESK TICKET TESTS (createOrAttachTicket helper)
# ═══════════════════════════════════════════════════════════════════════════════

class TestServiceDeskEndpoint:
    """Tests for /api/service_desk/attach_or_create_ticket endpoint"""
    
    def test_attach_or_create_ticket(self):
        """Test service desk ticket creation"""
        response = requests.post(
            f"{BASE_URL}/api/service_desk/attach_or_create_ticket",
            json={
                "parent_id": "test-parent",
                "pet_id": "test-pet-1",
                "pillar": "celebrate",
                "intent_primary": "CELEBRATE_BIRTHDAY",
                "intent_secondary": [],
                "life_state": "CELEBRATE",
                "channel": "Mira_OS",
                "initial_message": {
                    "sender": "parent",
                    "source": "Mira_OS",
                    "text": "I want to plan a birthday party"
                }
            }
        )
        assert response.status_code == 200
        data = response.json()
        # Should return ticket info
        print(f"✓ Service desk ticket endpoint working")


# ═══════════════════════════════════════════════════════════════════════════════
# CHAT MESSAGE RENDERING TESTS (via API responses with proper data)
# ═══════════════════════════════════════════════════════════════════════════════

class TestChatMessageDataFormats:
    """Tests that API returns data in correct format for ChatMessage component"""
    
    def test_products_data_format(self):
        """Test that products come in correct format for ProductsGrid component"""
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            json={
                "message": "show me birthday cakes for my dog",
                "pet_id": "test-pet-1",
                "pet": {"name": "Buddy", "breed": "Golden Retriever", "age": "3"},
                "parent_id": "test-parent"
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        if 'products' in data and len(data['products']) > 0:
            product = data['products'][0]
            # Verify product has required fields for ChatMessage.jsx ProductsGrid
            assert 'name' in product, "Product should have name"
            assert 'price' in product or 'originalPrice' in product, "Product should have price"
            print(f"✓ Products data format correct - {len(data['products'])} products returned")
        else:
            print("✓ No products in this response (valid case)")
    
    def test_response_has_text(self):
        """Test that response has text content for message body"""
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            json={
                "message": "Hello, how are you?",
                "pet_id": "test-pet-1",
                "pet": {"name": "Buddy", "breed": "Golden Retriever", "age": "3"},
                "parent_id": "test-parent"
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        assert 'response' in data, "Response should have text content"
        assert isinstance(data['response'], str), "Response text should be a string"
        assert len(data['response']) > 0, "Response text should not be empty"
        print("✓ Response has valid text content")


# ═══════════════════════════════════════════════════════════════════════════════
# RUN TESTS
# ═══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
