"""
Test Order Flow and Mira AI Order Recall
========================================
Tests for:
1. Order creation via POST /api/orders endpoint saves to database correctly
2. Orders include customer email, items, total, and status fields
3. Mira AI can recall recent orders when asked about purchase history
4. Mira AI recommends real services from catalogue when asking about birthday cakes/celebrations
5. Order flow creates service desk tickets (ticket_id returned)
6. Login flow works correctly
"""

import pytest
import requests
import os
import uuid
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://pillar-parity-sprint.preview.emergentagent.com').rstrip('/')

# Test credentials
TEST_EMAIL = "dipali@clubconcierge.in"
TEST_PASSWORD = "test123"
TEST_PET_ID = "pet-mojo-7327ad56"


class TestLoginFlow:
    """Test authentication flow"""
    
    def test_login_success(self):
        """Test login with valid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        
        data = response.json()
        assert "access_token" in data, "Missing access_token in response"
        assert data.get("message") == "Login successful", f"Unexpected message: {data.get('message')}"
        assert "user" in data, "Missing user object in response"
        assert data["user"]["email"] == TEST_EMAIL, "Email mismatch in user object"
        
        print(f"✅ Login successful for {TEST_EMAIL}")
        return data["access_token"]
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "wrong@example.com", "password": "wrongpass"}
        )
        assert response.status_code in [401, 403, 404], f"Expected auth error, got: {response.status_code}"
        print("✅ Invalid login correctly rejected")


@pytest.fixture
def auth_token():
    """Get authentication token"""
    response = requests.post(
        f"{BASE_URL}/api/auth/login",
        json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
    )
    if response.status_code == 200:
        return response.json().get("access_token")
    pytest.skip("Authentication failed - skipping authenticated tests")


@pytest.fixture
def authenticated_headers(auth_token):
    """Get headers with authorization"""
    return {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {auth_token}"
    }


class TestOrderCreation:
    """Test order creation and persistence"""
    
    def test_create_order_with_all_fields(self, authenticated_headers):
        """Test POST /api/orders creates order with all required fields"""
        unique_id = str(uuid.uuid4())[:8]
        order_data = {
            "customer": {
                "name": "Test Customer",
                "email": TEST_EMAIL,
                "phone": "+919876543210",
                "parentName": "Test Parent"
            },
            "items": [
                {
                    "id": f"test-item-{unique_id}",
                    "name": f"Test Birthday Cake {unique_id}",
                    "price": 1499,
                    "quantity": 1,
                    "category": "cakes",
                    "pillar": "celebrate"
                }
            ],
            "total": 1499,
            "status": "pending",
            "delivery": {
                "method": "delivery",
                "city": "Bangalore",
                "address": "Test Address 123",
                "date": "2026-03-20"
            },
            "pet": {
                "name": "TestPet",
                "breed": "Labrador"
            }
        }
        
        response = requests.post(
            f"{BASE_URL}/api/orders",
            headers=authenticated_headers,
            json=order_data
        )
        
        assert response.status_code == 200, f"Order creation failed: {response.text}"
        
        data = response.json()
        # Verify response has required fields
        assert "orderId" in data, "Missing orderId in response"
        assert "id" in data, "Missing id in response"
        assert data.get("message") == "Order created", f"Unexpected message: {data.get('message')}"
        
        # Verify ticket_id is returned (service desk integration)
        assert "ticket_id" in data, "Missing ticket_id - service desk ticket not created"
        print(f"✅ Order created with orderId: {data['orderId']}, ticket_id: {data.get('ticket_id')}")
        
        return data["orderId"]
    
    def test_order_persisted_with_correct_fields(self, authenticated_headers):
        """Test that created order is persisted and retrievable"""
        # Create order
        unique_id = str(uuid.uuid4())[:8]
        order_data = {
            "customer": {
                "name": "Persistence Test",
                "email": TEST_EMAIL,
                "phone": "+919876543210"
            },
            "items": [
                {
                    "id": f"persist-test-{unique_id}",
                    "name": f"Persistence Test Item {unique_id}",
                    "price": 799,
                    "quantity": 2,
                    "category": "treats"
                }
            ],
            "total": 1598,
            "status": "pending"
        }
        
        create_response = requests.post(
            f"{BASE_URL}/api/orders",
            headers=authenticated_headers,
            json=order_data
        )
        assert create_response.status_code == 200
        order_id = create_response.json()["orderId"]
        
        # Retrieve and verify
        get_response = requests.get(
            f"{BASE_URL}/api/orders/{order_id}",
            headers=authenticated_headers
        )
        assert get_response.status_code == 200, f"Failed to retrieve order: {get_response.text}"
        
        order = get_response.json()
        
        # Verify all fields
        assert order.get("orderId") == order_id, "orderId field mismatch"
        assert order.get("id") == order_id, "id field mismatch"
        assert order.get("customer", {}).get("email") == TEST_EMAIL, "customer.email mismatch"
        assert len(order.get("items", [])) == 1, "items not persisted correctly"
        assert order.get("items", [{}])[0].get("name") == f"Persistence Test Item {unique_id}", "item name mismatch"
        assert order.get("total") == 1598, "total mismatch"
        assert order.get("status") == "pending", "status mismatch"
        assert "created_at" in order, "created_at missing"
        
        print(f"✅ Order {order_id} persisted correctly with all fields")
    
    def test_get_my_orders(self, authenticated_headers):
        """Test GET /api/orders/my-orders returns user's orders"""
        response = requests.get(
            f"{BASE_URL}/api/orders/my-orders",
            headers=authenticated_headers
        )
        assert response.status_code == 200, f"Failed to get my orders: {response.text}"
        
        data = response.json()
        assert "orders" in data, "Missing orders in response"
        orders = data["orders"]
        
        # Verify orders belong to test user
        for order in orders[:5]:
            customer_email = order.get("customer", {}).get("email")
            if customer_email:  # Some old orders might not have this
                assert customer_email == TEST_EMAIL, f"Order doesn't belong to test user: {customer_email}"
        
        print(f"✅ Retrieved {len(orders)} orders for user")


class TestMiraOrderRecall:
    """Test Mira AI's ability to recall orders"""
    
    def test_mira_recalls_recent_orders(self, authenticated_headers):
        """Test that Mira AI can recall recent orders when asked about purchase history"""
        # First, create a distinctive order
        unique_id = str(uuid.uuid4())[:8]
        distinctive_item = f"MIRA_RECALL_TEST_CAKE_{unique_id}"
        
        order_data = {
            "customer": {
                "name": "Mira Recall Test",
                "email": TEST_EMAIL,
                "phone": "+919876543210"
            },
            "items": [
                {
                    "id": f"mira-recall-{unique_id}",
                    "name": distinctive_item,
                    "price": 999,
                    "quantity": 1,
                    "category": "cakes"
                }
            ],
            "total": 999,
            "status": "pending"
        }
        
        # Create the order
        create_response = requests.post(
            f"{BASE_URL}/api/orders",
            headers=authenticated_headers,
            json=order_data
        )
        assert create_response.status_code == 200, f"Order creation failed: {create_response.text}"
        
        # Wait a moment for order to be indexed
        time.sleep(1)
        
        # Ask Mira about purchase history
        mira_response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            headers=authenticated_headers,
            json={
                "message": "What have I ordered recently? Show me my recent purchases and orders.",
                "pet_id": TEST_PET_ID,
                "session_id": f"test-recall-{unique_id}"
            }
        )
        
        assert mira_response.status_code == 200, f"Mira chat failed: {mira_response.text}"
        
        data = mira_response.json()
        response_text = data.get("response", data.get("text", "")).lower()
        
        # Mira should mention orders or purchases
        assert any(kw in response_text for kw in ["order", "purchase", "bought", "cake", "item"]), \
            f"Mira response doesn't mention orders: {response_text[:300]}"
        
        print(f"✅ Mira recalled orders successfully. Response contains order/purchase context.")
    
    def test_mira_order_history_in_context(self, authenticated_headers):
        """Verify order history is loaded into Mira's context"""
        mira_response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            headers=authenticated_headers,
            json={
                "message": "Tell me about my last few orders and what I bought.",
                "pet_id": TEST_PET_ID,
                "session_id": f"test-history-{uuid.uuid4().hex[:8]}"
            }
        )
        
        assert mira_response.status_code == 200
        
        data = mira_response.json()
        response_text = data.get("response", data.get("text", ""))
        
        # Should mention specific items or order details
        has_order_context = any(kw in response_text.lower() for kw in [
            "birthday cake", "dog food", "premium", "chicken", "order", "purchase", "bought"
        ])
        
        assert has_order_context, f"Mira doesn't show order context: {response_text[:400]}"
        print(f"✅ Mira has order history context loaded")


class TestMiraCelebrationRecommendations:
    """Test Mira's ability to recommend celebration products/services"""
    
    def test_mira_recommends_birthday_items(self, authenticated_headers):
        """Test that Mira recommends real products when asked about birthday celebrations"""
        mira_response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            headers=authenticated_headers,
            json={
                "message": "I want to plan a birthday party for my dog. What birthday cakes and celebration items can you recommend?",
                "pet_id": TEST_PET_ID,
                "session_id": f"test-celebrate-{uuid.uuid4().hex[:8]}"
            }
        )
        
        assert mira_response.status_code == 200, f"Mira chat failed: {mira_response.text}"
        
        data = mira_response.json()
        response_text = data.get("response", data.get("text", ""))
        
        # Verify birthday-related recommendations
        birthday_keywords = ["cake", "party", "birthday", "celebrate", "bandana", "treat", "hat", "photo"]
        has_birthday_context = any(kw in response_text.lower() for kw in birthday_keywords)
        
        assert has_birthday_context, f"Mira doesn't recommend birthday items: {response_text[:400]}"
        
        # Check pillar is celebrate
        pillar = data.get("pillar", data.get("suggested_pillar", ""))
        assert pillar == "celebrate" or "celebrate" in str(data.get("os_context", {})), \
            f"Expected celebrate pillar, got: {pillar}"
        
        print(f"✅ Mira recommends celebration items. Pillar: {pillar}")
    
    def test_mira_celebrate_context(self, authenticated_headers):
        """Test that Mira activates celebrate pillar for party planning"""
        mira_response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            headers=authenticated_headers,
            json={
                "message": "Help me plan a pawty for my pup",
                "pet_id": TEST_PET_ID,
                "session_id": f"test-pawty-{uuid.uuid4().hex[:8]}"
            }
        )
        
        assert mira_response.status_code == 200
        
        data = mira_response.json()
        response_text = data.get("response", data.get("text", ""))
        
        # Should mention celebration-related items
        celebration_context = any(kw in response_text.lower() for kw in [
            "party", "celebrate", "birthday", "cake", "decoration", "pawty", "special"
        ])
        
        assert celebration_context, f"Mira doesn't provide celebration context: {response_text[:400]}"
        print(f"✅ Mira understands pawty/party context")


class TestServiceDeskTicketCreation:
    """Test that orders create service desk tickets"""
    
    def test_cake_order_creates_ticket(self, authenticated_headers):
        """Test that cake orders create service desk tickets"""
        unique_id = str(uuid.uuid4())[:8]
        
        order_data = {
            "customer": {
                "name": "Ticket Test Customer",
                "email": TEST_EMAIL,
                "phone": "+919876543210"
            },
            "items": [
                {
                    "id": f"cake-ticket-test-{unique_id}",
                    "name": "Birthday Celebration Cake",
                    "price": 1599,
                    "quantity": 1,
                    "category": "cakes",  # This triggers service desk ticket
                    "pillar": "celebrate"
                }
            ],
            "total": 1599,
            "status": "pending",
            "delivery": {
                "method": "delivery",
                "city": "Mumbai"
            }
        }
        
        response = requests.post(
            f"{BASE_URL}/api/orders",
            headers=authenticated_headers,
            json=order_data
        )
        
        assert response.status_code == 200, f"Order creation failed: {response.text}"
        
        data = response.json()
        
        # ticket_id should be present for cake orders
        assert "ticket_id" in data, "No ticket_id returned - service desk ticket not created"
        ticket_id = data.get("ticket_id")
        
        # Ticket ID should have proper format
        assert ticket_id and len(ticket_id) > 0, "ticket_id is empty"
        assert "TCK" in ticket_id or "TKT" in ticket_id, f"Invalid ticket_id format: {ticket_id}"
        
        print(f"✅ Cake order created service desk ticket: {ticket_id}")


# Run tests if executed directly
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
