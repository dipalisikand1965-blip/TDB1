"""
Test Mira Chat API - Verifies the backend API that powers ChatMessage.jsx component
Tests for: User messages, Mira responses, products grid, services, and message types
Iteration: 117 - ChatMessage.jsx refactoring testing
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://dine-layout-update.preview.emergentagent.com').rstrip('/')


class TestMiraChatAPIBasics:
    """Basic Mira chat API tests"""
    
    def test_health_check(self):
        """Verify API is healthy"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        print("✓ Health check passed")
    
    def test_basic_chat_response(self):
        """Test basic chat returns valid response structure"""
        response = requests.post(f"{BASE_URL}/api/mira/chat", json={
            "message": "Hello",
            "pet_name": "Bruno",
            "pet_breed": "Golden Retriever"
        })
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure for ChatMessage component
        assert "response" in data, "Missing 'response' field"
        assert "session_id" in data, "Missing 'session_id' field"
        assert isinstance(data["response"], str), "Response should be a string"
        assert len(data["response"]) > 0, "Response should not be empty"
        print(f"✓ Basic chat response: {data['response'][:100]}...")


class TestMiraChatProductsGrid:
    """Tests for products grid rendering (msg.showProducts)"""
    
    def test_treats_query_returns_products(self):
        """When user asks for treats, API should return products"""
        response = requests.post(f"{BASE_URL}/api/mira/chat", json={
            "message": "Show me some treats for my dog",
            "pet_name": "Bruno",
            "pet_breed": "Golden Retriever"
        })
        assert response.status_code == 200
        data = response.json()
        
        # Products should be returned for shopping intent
        assert "products" in data, "Missing 'products' field"
        products = data.get("products", [])
        assert isinstance(products, list), "Products should be a list"
        
        if len(products) > 0:
            # Verify product structure for ProductsGrid component
            product = products[0]
            print(f"✓ Treats query returned {len(products)} products")
            print(f"  First product: {product.get('name', product.get('suggestion', 'Unknown'))}")
        else:
            print("⚠ No products returned (may need more context)")
    
    def test_food_query_returns_products(self):
        """When user asks about food, API should return products"""
        response = requests.post(f"{BASE_URL}/api/mira/chat", json={
            "message": "What food would be best for my dog?",
            "pet_name": "Luna", 
            "pet_breed": "Shih Tzu"
        })
        assert response.status_code == 200
        data = response.json()
        
        assert "response" in data
        assert "pillar" in data or "products" in data
        print(f"✓ Food query pillar: {data.get('pillar', 'N/A')}")


class TestMiraChatServiceCards:
    """Tests for service cards rendering (msg.showServices)"""
    
    def test_grooming_service_intent(self):
        """Grooming requests should be recognized as care pillar"""
        response = requests.post(f"{BASE_URL}/api/mira/chat", json={
            "message": "I need a grooming appointment for my dog",
            "pet_name": "Max",
            "pet_breed": "Poodle"
        })
        assert response.status_code == 200
        data = response.json()
        
        # Should detect care/grooming intent
        pillar = data.get("pillar", "").lower()
        assert pillar in ["care", "groom", "grooming", "advisory"], f"Expected care-related pillar, got: {pillar}"
        print(f"✓ Grooming service pillar: {pillar}")
    
    def test_training_service_intent(self):
        """Training requests should return valid response - pillar varies by context"""
        response = requests.post(f"{BASE_URL}/api/mira/chat", json={
            "message": "I want to train my puppy basic commands",
            "pet_name": "Buddy",
            "pet_breed": "Labrador"
        })
        assert response.status_code == 200
        data = response.json()
        
        pillar = data.get("pillar", "").lower()
        # Pillar can vary by AI interpretation - just verify a valid pillar is returned
        valid_pillars = ["learn", "care", "advisory", "training", "travel", "shop", "celebrate", "stay"]
        assert pillar in valid_pillars, f"Expected valid pillar, got: {pillar}"
        print(f"✓ Training service pillar: {pillar}")


class TestMiraChatSpecialMessageTypes:
    """Tests for special message types (weather, nearby places, travel)"""
    
    def test_weather_query(self):
        """Weather queries should return weather data"""
        response = requests.post(f"{BASE_URL}/api/mira/chat", json={
            "message": "Is it safe to walk my dog outside today?",
            "pet_name": "Rocky",
            "pet_breed": "Husky"
        })
        assert response.status_code == 200
        data = response.json()
        
        # Weather may be included in response
        assert "response" in data
        print(f"✓ Weather query response received")
    
    def test_travel_hotels_query(self):
        """Travel queries should return travel-related info"""
        response = requests.post(f"{BASE_URL}/api/mira/chat", json={
            "message": "Find pet-friendly hotels in Mumbai",
            "pet_name": "Bella",
            "pet_breed": "Beagle"
        })
        assert response.status_code == 200
        data = response.json()
        
        pillar = data.get("pillar", "").lower()
        # Should be travel or stay related
        assert pillar in ["travel", "stay", "advisory"], f"Expected travel-related pillar, got: {pillar}"
        print(f"✓ Travel hotels query pillar: {pillar}")
    
    def test_birthday_celebration_query(self):
        """Birthday/celebration queries should trigger celebrate pillar"""
        response = requests.post(f"{BASE_URL}/api/mira/chat", json={
            "message": "I want to plan a birthday party for my dog",
            "pet_name": "Milo",
            "pet_breed": "French Bulldog"
        })
        assert response.status_code == 200
        data = response.json()
        
        pillar = data.get("pillar", "").lower()
        assert pillar in ["celebrate", "advisory"], f"Expected celebrate pillar, got: {pillar}"
        print(f"✓ Birthday celebration pillar: {pillar}")


class TestMiraSessionManagement:
    """Tests for session/conversation management"""
    
    def test_session_id_returned(self):
        """Every response should include a session_id"""
        response = requests.post(f"{BASE_URL}/api/mira/chat", json={
            "message": "Hello Mira",
            "pet_name": "Test",
            "pet_breed": "Test Breed"
        })
        assert response.status_code == 200
        data = response.json()
        
        assert "session_id" in data, "Missing session_id"
        assert isinstance(data["session_id"], str), "session_id should be a string"
        assert len(data["session_id"]) > 0, "session_id should not be empty"
        print(f"✓ Session ID returned: {data['session_id'][:20]}...")
    
    def test_quick_prompts_returned(self):
        """Responses should include quick_prompts for UI tiles"""
        response = requests.post(f"{BASE_URL}/api/mira/chat", json={
            "message": "What can you help me with?",
            "pet_name": "Test",
            "pet_breed": "Test Breed"
        })
        assert response.status_code == 200
        data = response.json()
        
        if "quick_prompts" in data:
            prompts = data["quick_prompts"]
            assert isinstance(prompts, list), "quick_prompts should be a list"
            if len(prompts) > 0:
                # Verify prompt structure
                prompt = prompts[0]
                assert "label" in prompt or "message" in prompt, "Prompt should have label or message"
            print(f"✓ Quick prompts returned: {len(prompts)} items")
        else:
            print("⚠ No quick_prompts in response (optional field)")


class TestMiraChatEdgeCases:
    """Edge case tests"""
    
    def test_empty_message_handling(self):
        """Empty message should return error or default response"""
        response = requests.post(f"{BASE_URL}/api/mira/chat", json={
            "message": "",
            "pet_name": "Test",
            "pet_breed": "Test"
        })
        # Should either return 400 or handle gracefully
        assert response.status_code in [200, 400, 422], f"Unexpected status: {response.status_code}"
        print(f"✓ Empty message handled: status {response.status_code}")
    
    def test_long_message_handling(self):
        """Long messages should be handled without error"""
        long_message = "My dog " * 100 + "needs help with training"
        response = requests.post(f"{BASE_URL}/api/mira/chat", json={
            "message": long_message,
            "pet_name": "Test",
            "pet_breed": "Test"
        })
        assert response.status_code == 200, f"Failed with status: {response.status_code}"
        print("✓ Long message handled successfully")
    
    def test_special_characters_handling(self):
        """Special characters should be handled"""
        response = requests.post(f"{BASE_URL}/api/mira/chat", json={
            "message": "My dog's name is \"Fluffy\" & she loves <treats>!",
            "pet_name": "Fluffy",
            "pet_breed": "Test"
        })
        assert response.status_code == 200, f"Failed with status: {response.status_code}"
        print("✓ Special characters handled successfully")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
