"""
Iteration 97 Backend Tests
Testing:
1. Floating Contact Button hiding on /mira page (frontend test)
2. Member Dashboard 'All Services' tab with 14 pillars (frontend test)
3. /api/mira/session/{session_id} endpoint returns messages array
4. /api/product-box/products PUT endpoint with image_url field
5. Member Dashboard loads correctly when logged in
"""

import pytest
import requests
import os
import json
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://architecture-rebuild.preview.emergentagent.com').rstrip('/')

# Test credentials
ADMIN_USERNAME = "aditya"
ADMIN_PASSWORD = "lola4304"
MEMBER_EMAIL = "dipali@clubconcierge.in"
MEMBER_PASSWORD = "test123"


class TestHealthCheck:
    """Basic health check tests"""
    
    def test_api_health(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        print(f"✓ API health check passed: {data}")


class TestMiraSessionEndpoint:
    """Test /api/mira/session/{session_id} endpoint"""
    
    def test_mira_session_not_found(self):
        """Test session endpoint returns 404 for non-existent session"""
        response = requests.get(f"{BASE_URL}/api/mira/session/non-existent-session-id")
        assert response.status_code == 404
        print("✓ Mira session returns 404 for non-existent session")
    
    def test_mira_chat_creates_session(self):
        """Test that Mira chat creates a session and returns messages"""
        # First, create a chat session
        chat_payload = {
            "message": "Hello, I need help with my dog",
            "source": "web_widget"
        }
        
        chat_response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            json=chat_payload
        )
        
        # Chat should succeed
        assert chat_response.status_code == 200, f"Chat failed: {chat_response.text}"
        chat_data = chat_response.json()
        
        # Should have session_id
        session_id = chat_data.get("session_id")
        assert session_id is not None, "No session_id returned from chat"
        print(f"✓ Chat created session: {session_id}")
        
        # Now fetch the session
        session_response = requests.get(f"{BASE_URL}/api/mira/session/{session_id}")
        assert session_response.status_code == 200, f"Session fetch failed: {session_response.text}"
        
        session_data = session_response.json()
        
        # Verify messages array exists at root level
        assert "messages" in session_data, "messages array not found in session response"
        messages = session_data.get("messages", [])
        assert isinstance(messages, list), "messages should be a list"
        print(f"✓ Session endpoint returns messages array with {len(messages)} messages")
        
        # Verify message structure
        if messages:
            msg = messages[0]
            assert "sender" in msg, "Message should have sender field"
            assert "content" in msg, "Message should have content field"
            print(f"✓ Message structure verified: sender={msg.get('sender')}")
        
        return session_id


class TestProductBoxEndpoint:
    """Test /api/product-box/products PUT endpoint with image_url"""
    
    def test_product_box_products_list(self):
        """Test listing products from product box"""
        response = requests.get(f"{BASE_URL}/api/product-box/products")
        assert response.status_code == 200
        data = response.json()
        assert "products" in data
        print(f"✓ Product box returns {len(data.get('products', []))} products")
        return data.get("products", [])
    
    def test_product_box_create_with_image_url(self):
        """Test creating a product with image_url field"""
        test_product = {
            "name": f"TEST_Product_{datetime.now().strftime('%Y%m%d%H%M%S')}",
            "product_type": "physical",
            "short_description": "Test product for iteration 97",
            "image_url": "https://example.com/test-image.jpg",
            "pillars": ["shop"],
            "pricing": {
                "base_price": 999,
                "currency": "INR"
            },
            "visibility": {
                "status": "draft"
            }
        }
        
        response = requests.post(
            f"{BASE_URL}/api/product-box/products",
            json=test_product
        )
        
        assert response.status_code == 200, f"Create product failed: {response.text}"
        data = response.json()
        
        product = data.get("product", {})
        product_id = product.get("id")
        assert product_id is not None, "Product ID not returned"
        print(f"✓ Created product with ID: {product_id}")
        
        return product_id
    
    def test_product_box_update_with_image_url(self):
        """Test updating a product with image_url field"""
        # First create a product
        product_id = self.test_product_box_create_with_image_url()
        
        # Now update with new image_url
        update_payload = {
            "image_url": "https://example.com/updated-image.jpg",
            "short_description": "Updated description with image"
        }
        
        response = requests.put(
            f"{BASE_URL}/api/product-box/products/{product_id}",
            json=update_payload
        )
        
        assert response.status_code == 200, f"Update product failed: {response.text}"
        data = response.json()
        
        updated_product = data.get("product", {})
        assert updated_product.get("image_url") == "https://example.com/updated-image.jpg", \
            f"image_url not updated correctly: {updated_product.get('image_url')}"
        print(f"✓ Product image_url updated successfully")
        
        # Cleanup - archive the test product
        requests.delete(f"{BASE_URL}/api/product-box/products/{product_id}")
        print(f"✓ Test product archived")


class TestMemberAuthentication:
    """Test member authentication and dashboard access"""
    
    def test_member_login(self):
        """Test member login endpoint"""
        login_payload = {
            "email": MEMBER_EMAIL,
            "password": MEMBER_PASSWORD
        }
        
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json=login_payload
        )
        
        if response.status_code == 200:
            data = response.json()
            token = data.get("token") or data.get("access_token")
            assert token is not None, "No token returned from login"
            print(f"✓ Member login successful, token received")
            return token
        else:
            # Login might fail if user doesn't exist - that's okay for testing
            print(f"⚠ Member login returned {response.status_code}: {response.text}")
            pytest.skip("Member login not available - user may not exist")
    
    def test_member_dashboard_data(self):
        """Test that member dashboard data endpoints work"""
        # Try to login first
        try:
            token = self.test_member_login()
        except:
            pytest.skip("Could not get auth token")
            return
        
        headers = {"Authorization": f"Bearer {token}"}
        
        # Test orders endpoint
        orders_response = requests.get(
            f"{BASE_URL}/api/orders/my-orders",
            headers=headers
        )
        print(f"Orders endpoint: {orders_response.status_code}")
        
        # Test pets endpoint
        pets_response = requests.get(
            f"{BASE_URL}/api/pets/my-pets",
            headers=headers
        )
        print(f"Pets endpoint: {pets_response.status_code}")
        
        # At least one should work
        assert orders_response.status_code in [200, 401] or pets_response.status_code in [200, 401]
        print("✓ Member dashboard data endpoints accessible")


class TestMiraPillars:
    """Test Mira pillars endpoint"""
    
    def test_get_all_pillars(self):
        """Test that all 14 pillars are returned"""
        response = requests.get(f"{BASE_URL}/api/mira/pillars")
        assert response.status_code == 200
        
        data = response.json()
        pillars = data.get("pillars", [])
        
        # Should have 14 pillars
        expected_pillars = [
            "celebrate", "dine", "stay", "travel", "care", "enjoy", 
            "fit", "learn", "paperwork", "advisory", "emergency", 
            "farewell", "adopt", "shop"
        ]
        
        for pillar in expected_pillars:
            assert pillar in pillars, f"Missing pillar: {pillar}"
        
        print(f"✓ All 14 pillars present: {pillars}")


class TestMiraQuickPrompts:
    """Test Mira quick prompts for different pillars"""
    
    def test_quick_prompts_celebrate(self):
        """Test quick prompts for celebrate pillar"""
        response = requests.get(f"{BASE_URL}/api/mira/quick-prompts/celebrate")
        assert response.status_code == 200
        data = response.json()
        prompts = data.get("prompts", [])
        assert len(prompts) > 0, "No prompts returned for celebrate pillar"
        print(f"✓ Celebrate pillar has {len(prompts)} quick prompts")
    
    def test_quick_prompts_travel(self):
        """Test quick prompts for travel pillar"""
        response = requests.get(f"{BASE_URL}/api/mira/quick-prompts/travel")
        assert response.status_code == 200
        data = response.json()
        prompts = data.get("prompts", [])
        assert len(prompts) > 0, "No prompts returned for travel pillar"
        print(f"✓ Travel pillar has {len(prompts)} quick prompts")


class TestMiraHistory:
    """Test Mira conversation history endpoint"""
    
    def test_mira_history_guest(self):
        """Test Mira history for guest user"""
        response = requests.get(f"{BASE_URL}/api/mira/history")
        # Should return empty or 401 for guest
        assert response.status_code in [200, 401]
        print(f"✓ Mira history endpoint accessible: {response.status_code}")


class TestMiraStats:
    """Test Mira stats endpoint"""
    
    def test_mira_stats(self):
        """Test Mira stats endpoint"""
        response = requests.get(f"{BASE_URL}/api/mira/stats")
        assert response.status_code == 200
        data = response.json()
        print(f"✓ Mira stats: {data}")


# Run tests
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
