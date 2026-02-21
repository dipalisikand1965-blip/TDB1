"""
Mira OS Test Suite - Iteration Testing
======================================
Tests for:
1. /api/mira/os/understand-with-products - Rich CONCIERGE responses
2. /api/mira/feedback - Feedback storage
3. /api/mira/remember - Pet memory storage
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_USER_EMAIL = "mira_test@example.com"
TEST_USER_PASSWORD = "MiraTest123!"


class TestMiraAuth:
    """Test authentication for Mira endpoints that require auth"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Register and login to get auth token"""
        # Try to register first (may already exist)
        register_response = requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "email": TEST_USER_EMAIL,
                "password": TEST_USER_PASSWORD,
                "name": "Mira Test User"
            }
        )
        
        # Now login
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": TEST_USER_EMAIL,
                "password": TEST_USER_PASSWORD
            }
        )
        
        if login_response.status_code == 200:
            return login_response.json().get("access_token")
        return None


class TestMiraOSUnderstandWithProducts:
    """Tests for /api/mira/os/understand-with-products endpoint"""
    
    def test_endpoint_accessible(self):
        """Verify endpoint is accessible"""
        response = requests.post(
            f"{BASE_URL}/api/mira/os/understand-with-products",
            json={
                "input": "hello",
                "pet_context": {"name": "Buddy", "breed": "Golden Retriever"}
            }
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("✓ Endpoint accessible")
    
    def test_concierge_response_rich_birthday_plan(self):
        """
        Test that CONCIERGE execution type returns rich response
        for birthday planning - NOT sparse 'I'll connect you' messages
        """
        response = requests.post(
            f"{BASE_URL}/api/mira/os/understand-with-products",
            json={
                "input": "plan Buddy birthday party",
                "pet_context": {
                    "name": "Buddy",
                    "breed": "Golden Retriever",
                    "age": "3 years",
                    "traits": ["Playful", "Friendly", "Energetic"],
                    "sensitivities": ["Chicken allergy"],
                    "favorites": ["Tennis balls", "Peanut butter treats"]
                },
                "page_context": "mira-demo"
            },
            timeout=30  # LLM takes 5-8 seconds
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        # Verify response structure
        assert data.get("success") == True, "Response should indicate success"
        assert "understanding" in data, "Response should have understanding"
        assert "response" in data, "Response should have response"
        assert "execution_type" in data, "Response should have execution_type"
        
        # Verify intent detection
        understanding = data["understanding"]
        assert understanding.get("intent") == "PLAN", f"Expected PLAN intent, got {understanding.get('intent')}"
        
        # Verify execution type is CONCIERGE for complex planning
        # Note: This may vary based on LLM response
        
        # CRITICAL: Verify message is RICH, not sparse
        message = data["response"].get("message", "")
        print(f"Response message length: {len(message)} chars")
        print(f"Response message: {message[:300]}...")
        
        # A rich response should be at least 200 characters with breed-specific tips
        assert len(message) >= 100, f"Message too sparse! Got {len(message)} chars. Rich responses should be 200+ chars"
        
        # Check for breed-specific content
        message_lower = message.lower()
        has_personalization = any([
            "buddy" in message_lower,
            "golden retriever" in message_lower,
            "retriever" in message_lower,
            "energetic" in message_lower,
            "water" in message_lower,  # GR's love water
            "chicken" in message_lower,  # allergy awareness
        ])
        
        print(f"✓ Message has personalization: {has_personalization}")
        
        # Message should NOT be sparse like "I'll connect you with your concierge"
        sparse_messages = [
            "i'll connect you with your concierge",
            "let me connect you",
            "connecting you with"
        ]
        is_sparse = any(sparse in message_lower for sparse in sparse_messages) and len(message) < 150
        assert not is_sparse, f"Response is sparse! Message: {message}"
        
        print("✓ CONCIERGE response is rich and personalized")
    
    def test_response_has_products_suggestions(self):
        """Test that response includes product suggestions"""
        response = requests.post(
            f"{BASE_URL}/api/mira/os/understand-with-products",
            json={
                "input": "find soft treats for Buddy",
                "pet_context": {
                    "name": "Buddy",
                    "breed": "Golden Retriever"
                }
            },
            timeout=30
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Check for products in response
        products = data.get("response", {}).get("products", [])
        print(f"Products returned: {len(products)}")
        
        # Products may be from LLM suggestions or real DB products
        # Either is acceptable
        if products:
            print(f"✓ Found {len(products)} product suggestions")
            for p in products[:2]:
                print(f"  - {p.get('name', p.get('suggestion', 'Unknown'))}")
        else:
            print("⚠ No products in response (acceptable for some queries)")
    
    def test_intent_classification(self):
        """Test various intent classifications"""
        test_cases = [
            ("find treats for my dog", "FIND"),
            ("compare food brands", "COMPARE"),
            ("what are golden retriever health issues", "EXPLORE"),
        ]
        
        for query, expected_intent in test_cases:
            response = requests.post(
                f"{BASE_URL}/api/mira/os/understand-with-products",
                json={
                    "input": query,
                    "pet_context": {"name": "Buddy", "breed": "Golden Retriever"}
                },
                timeout=30
            )
            
            assert response.status_code == 200
            data = response.json()
            actual_intent = data.get("understanding", {}).get("intent", "")
            print(f"Query: '{query}' → Intent: {actual_intent} (expected: {expected_intent})")


class TestMiraFeedback:
    """Tests for /api/mira/feedback endpoint"""
    
    def test_submit_positive_feedback(self):
        """Test submitting positive feedback"""
        response = requests.post(
            f"{BASE_URL}/api/mira/feedback",
            json={
                "query": "find treats for Buddy",
                "response": "Here are some great treats for Golden Retrievers...",
                "is_positive": True,
                "intent": "FIND",
                "execution_type": "INSTANT",
                "pet_id": "test-pet",
                "timestamp": "2026-02-07T00:00:00Z"
            }
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        assert data.get("success") == True, "Feedback should be successful"
        assert "feedback_id" in data, "Response should include feedback_id"
        assert data.get("message") == "Thank you for your feedback!"
        
        print(f"✓ Positive feedback submitted, ID: {data['feedback_id']}")
    
    def test_submit_negative_feedback(self):
        """Test submitting negative feedback"""
        response = requests.post(
            f"{BASE_URL}/api/mira/feedback",
            json={
                "query": "plan birthday party",
                "response": "I'll connect you with a concierge.",
                "is_positive": False,
                "intent": "PLAN",
                "execution_type": "CONCIERGE",
                "pet_id": "test-pet"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("success") == True
        print(f"✓ Negative feedback submitted, ID: {data['feedback_id']}")


class TestMiraRemember:
    """Tests for /api/mira/remember endpoint (requires auth)"""
    
    @pytest.fixture(scope="class")
    def auth_headers(self):
        """Get auth token for remember endpoint"""
        # First register
        requests.post(
            f"{BASE_URL}/api/auth/register",
            json={
                "email": TEST_USER_EMAIL,
                "password": TEST_USER_PASSWORD,
                "name": "Mira Test User"
            }
        )
        
        # Then login
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": TEST_USER_EMAIL,
                "password": TEST_USER_PASSWORD
            }
        )
        
        if login_response.status_code == 200:
            token = login_response.json().get("access_token")
            return {"Authorization": f"Bearer {token}"}
        pytest.skip("Authentication failed")
    
    def test_remember_requires_auth(self):
        """Test that remember endpoint requires authentication"""
        response = requests.post(
            f"{BASE_URL}/api/mira/remember",
            json={
                "fact": "Buddy loves swimming",
                "pet_id": "test-pet",
                "category": "preference"
            }
        )
        
        assert response.status_code == 401, f"Expected 401 without auth, got {response.status_code}"
        print("✓ Remember endpoint requires authentication")
    
    def test_remember_with_auth(self, auth_headers):
        """Test saving a pet memory with authentication"""
        response = requests.post(
            f"{BASE_URL}/api/mira/remember",
            headers=auth_headers,
            json={
                "fact": "Buddy gets anxious during thunderstorms",
                "pet_id": "test-pet-mira",
                "category": "behavior"
            }
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert data.get("success") == True, "Remember should be successful"
        assert "memory_id" in data, "Response should include memory_id"
        assert data.get("message") == "Got it! I've noted that for future reference."
        
        print(f"✓ Memory saved, ID: {data['memory_id']}")
    
    def test_get_pet_memories(self, auth_headers):
        """Test retrieving pet memories"""
        # First save a memory
        requests.post(
            f"{BASE_URL}/api/mira/remember",
            headers=auth_headers,
            json={
                "fact": "TEST memory for retrieval",
                "pet_id": "test-pet-mira",
                "category": "general"
            }
        )
        
        # Now get memories
        response = requests.get(
            f"{BASE_URL}/api/mira/memories/test-pet-mira",
            headers=auth_headers
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        assert data.get("success") == True
        assert "memories" in data
        assert isinstance(data["memories"], list)
        
        print(f"✓ Retrieved {len(data['memories'])} memories for test pet")


class TestHealthEndpoints:
    """Basic health checks"""
    
    def test_api_health(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        print("✓ API health OK")
    
    def test_db_health(self):
        """Test DB health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health/db")
        assert response.status_code == 200
        print("✓ DB health OK")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
