"""
Comprehensive Backend API Tests for The Doggy Company
Tests all critical endpoints including:
- Authentication (Admin & Member)
- Mira AI Chat
- Service Desk AI (Draft Reply, Summary)
- Product Search
- Smart Recommendations
- Adopt (Pets, Shelters, Events)
- Tickets
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://furbuddy-os.preview.emergentagent.com').rstrip('/')

class TestHealth:
    """Health check tests"""
    
    def test_health_endpoint(self):
        """Test health endpoint returns healthy status"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        print(f"✓ Health check passed: {data}")


class TestAuthentication:
    """Authentication endpoint tests"""
    
    def test_admin_login_success(self):
        """Test admin login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "username": "aditya",
            "password": "lola4304"
        })
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert "token" in data
        print(f"✓ Admin login successful")
        return data.get("token")
    
    def test_admin_login_invalid_credentials(self):
        """Test admin login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "username": "invalid",
            "password": "wrongpassword"
        })
        assert response.status_code in [401, 400]
        print(f"✓ Admin login correctly rejected invalid credentials")
    
    def test_member_login_success(self):
        """Test member login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "dipali@clubconcierge.in",
            "password": "lola4304"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data.get("user", {}).get("email") == "dipali@clubconcierge.in"
        print(f"✓ Member login successful: {data.get('user', {}).get('name')}")
        return data.get("access_token")
    
    def test_member_login_invalid_credentials(self):
        """Test member login with invalid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "invalid@example.com",
            "password": "wrongpassword"
        })
        assert response.status_code in [401, 400]
        print(f"✓ Member login correctly rejected invalid credentials")


class TestMiraAI:
    """Mira AI Chat tests - Testing conversational behavior"""
    
    @pytest.fixture
    def user_token(self):
        """Get user token for authenticated requests"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "dipali@clubconcierge.in",
            "password": "lola4304"
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Authentication failed")
    
    def test_mira_chat_birthday_cake_request(self, user_token):
        """Test Mira AI response to birthday cake request with allergy"""
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            headers={"Authorization": f"Bearer {user_token}"},
            json={
                "message": "I need a birthday cake for my dog who has dairy allergy",
                "session_id": f"test-session-{int(time.time())}",
                "source": "web_widget",
                "current_pillar": "celebrate",
                "history": []
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "response" in data
        
        # Check if Mira is being conversational (asking questions) vs giving direct recommendations
        mira_response = data.get("response", "").lower()
        products = data.get("products", [])
        
        # Log the behavior for analysis
        is_conversational = any(phrase in mira_response for phrase in [
            "which dog", "is this for", "before i suggest", "let me understand",
            "which one", "confirm", "tell me more"
        ])
        
        print(f"✓ Mira AI responded")
        print(f"  - Response length: {len(data.get('response', ''))}")
        print(f"  - Products returned: {len(products)}")
        print(f"  - Is conversational (asking questions): {is_conversational}")
        
        # NOTE: Current behavior is conversational - Mira asks clarifying questions
        # This is by design in the system prompt (7-step flow)
        # User reported wanting DIRECT product recommendations instead
    
    def test_mira_chat_simple_product_request(self, user_token):
        """Test Mira AI response to simple product request"""
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            headers={"Authorization": f"Bearer {user_token}"},
            json={
                "message": "Show me some puppy treats",
                "session_id": f"test-session-{int(time.time())}",
                "source": "web_widget",
                "current_pillar": "shop",
                "history": []
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "response" in data
        
        products = data.get("products", [])
        print(f"✓ Mira AI responded to puppy treats request")
        print(f"  - Products returned: {len(products)}")


class TestServiceDeskAI:
    """Service Desk AI endpoint tests"""
    
    @pytest.fixture
    def admin_token(self):
        """Get admin token for authenticated requests"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "username": "aditya",
            "password": "lola4304"
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Admin authentication failed")
    
    @pytest.fixture
    def valid_ticket_id(self):
        """Get a valid ticket ID for testing"""
        response = requests.get(f"{BASE_URL}/api/tickets?limit=1")
        if response.status_code == 200:
            tickets = response.json().get("tickets", [])
            if tickets:
                return tickets[0].get("ticket_id")
        pytest.skip("No tickets available for testing")
    
    def test_ai_draft_reply(self, admin_token, valid_ticket_id):
        """Test AI draft reply generation"""
        response = requests.post(
            f"{BASE_URL}/api/tickets/ai/draft-reply",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "ticket_id": valid_ticket_id,
                "reply_type": "professional"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert "draft" in data
        assert len(data.get("draft", "")) > 0
        print(f"✓ AI Draft Reply generated successfully")
        print(f"  - Draft length: {len(data.get('draft', ''))}")
    
    def test_ai_summary(self, admin_token, valid_ticket_id):
        """Test AI summary generation"""
        response = requests.post(
            f"{BASE_URL}/api/tickets/ai/summary/{valid_ticket_id}",
            headers={"Authorization": f"Bearer {admin_token}"},
            json={
                "num_conversations": 30,
                "include_incoming": True,
                "include_outgoing": True,
                "include_internal": False
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "summary" in data
        print(f"✓ AI Summary generated: {data.get('summary', '')[:100]}...")


class TestProductSearch:
    """Product search endpoint tests"""
    
    def test_search_shih_tzu_cake(self):
        """Test product search for shih tzu cake"""
        response = requests.get(f"{BASE_URL}/api/search?q=shih%20tzu%20cake&limit=5")
        assert response.status_code == 200
        data = response.json()
        assert "hits" in data
        hits = data.get("hits", [])
        print(f"✓ Search 'shih tzu cake' returned {len(hits)} results")
        if hits:
            print(f"  - First result: {hits[0].get('name')}")
    
    def test_search_boxer(self):
        """Test product search for boxer"""
        response = requests.get(f"{BASE_URL}/api/search?q=boxer&limit=5")
        assert response.status_code == 200
        data = response.json()
        assert "hits" in data
        hits = data.get("hits", [])
        print(f"✓ Search 'boxer' returned {len(hits)} results")
    
    def test_search_puppy_treats(self):
        """Test product search for puppy treats"""
        response = requests.get(f"{BASE_URL}/api/search?q=puppy%20treats&limit=5")
        assert response.status_code == 200
        data = response.json()
        assert "hits" in data
        print(f"✓ Search 'puppy treats' returned {len(data.get('hits', []))} results")


class TestProducts:
    """Product endpoint tests"""
    
    def test_get_products(self):
        """Test getting products list"""
        response = requests.get(f"{BASE_URL}/api/products?limit=5")
        assert response.status_code == 200
        data = response.json()
        assert "products" in data
        products = data.get("products", [])
        assert len(products) > 0
        
        # Check for intelligent_tags
        products_with_tags = sum(1 for p in products if p.get("intelligent_tags"))
        print(f"✓ Products endpoint returned {len(products)} products")
        print(f"  - Products with intelligent_tags: {products_with_tags}/{len(products)}")


class TestSmartRecommendations:
    """Smart recommendations endpoint tests"""
    
    def test_smart_recommendations(self):
        """Test smart recommendations for a user"""
        # Using the known user ID from login
        user_id = "a152181a-2f81-4323-845e-2b5146906fe9"
        response = requests.get(f"{BASE_URL}/api/smart/recommendations/{user_id}")
        assert response.status_code == 200
        data = response.json()
        
        # Check for breed_picks
        breed_picks = data.get("breed_picks", [])
        print(f"✓ Smart recommendations returned {len(breed_picks)} breed picks")
        if breed_picks:
            print(f"  - First recommendation: {breed_picks[0].get('name')}")


class TestAdopt:
    """Adopt pillar endpoint tests"""
    
    def test_get_adopt_pets(self):
        """Test getting adoptable pets"""
        response = requests.get(f"{BASE_URL}/api/adopt/pets?limit=5")
        assert response.status_code == 200
        data = response.json()
        assert "pets" in data
        pets = data.get("pets", [])
        print(f"✓ Adopt pets endpoint returned {len(pets)} pets")
        if pets:
            print(f"  - First pet: {pets[0].get('name')} ({pets[0].get('breed')})")
    
    def test_get_adopt_shelters(self):
        """Test getting shelters"""
        response = requests.get(f"{BASE_URL}/api/adopt/shelters?limit=5")
        assert response.status_code == 200
        data = response.json()
        assert "shelters" in data
        shelters = data.get("shelters", [])
        print(f"✓ Adopt shelters endpoint returned {len(shelters)} shelters")
    
    def test_get_adopt_events(self):
        """Test getting adoption events"""
        response = requests.get(f"{BASE_URL}/api/adopt/events?limit=5")
        assert response.status_code == 200
        data = response.json()
        assert "events" in data
        events = data.get("events", [])
        print(f"✓ Adopt events endpoint returned {len(events)} events")


class TestTickets:
    """Tickets endpoint tests"""
    
    def test_get_tickets(self):
        """Test getting tickets list"""
        response = requests.get(f"{BASE_URL}/api/tickets?limit=5")
        assert response.status_code == 200
        data = response.json()
        assert "tickets" in data
        tickets = data.get("tickets", [])
        print(f"✓ Tickets endpoint returned {len(tickets)} tickets")
        if tickets:
            print(f"  - First ticket: {tickets[0].get('ticket_id')} - {tickets[0].get('subject', '')[:50]}")


class TestCartSnapshot:
    """Cart snapshot endpoint tests (for abandoned cart tracking)"""
    
    def test_cart_snapshot(self):
        """Test cart snapshot endpoint"""
        response = requests.post(
            f"{BASE_URL}/api/cart/snapshot",
            json={
                "session_id": f"test-session-{int(time.time())}",
                "items": [
                    {
                        "product_id": "shopify-8016298705050",
                        "name": "Mynx Shih Tzu Cake",
                        "price": 649.0,
                        "quantity": 1
                    }
                ],
                "subtotal": 649.0
            }
        )
        # Cart snapshot should work
        assert response.status_code in [200, 201]
        print(f"✓ Cart snapshot successful")
    
    def test_cart_capture_email(self):
        """Test cart email capture endpoint"""
        # Note: This endpoint expects query parameters, not JSON body
        session_id = f"test-session-{int(time.time())}"
        response = requests.post(
            f"{BASE_URL}/api/cart/capture-email?session_id={session_id}&email=test@example.com"
        )
        # Should work or return appropriate status
        assert response.status_code in [200, 201]
        print(f"✓ Cart capture email endpoint responded")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
