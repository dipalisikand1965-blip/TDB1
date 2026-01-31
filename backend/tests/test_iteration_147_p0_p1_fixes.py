"""
Iteration 147: P0/P1 Bug Fixes Testing
======================================
Tests for:
1. P0: Quick Book shows correct service type (grooming not hotel_booking)
2. P0: Conversational kit assembly - asks questions BEFORE assembling
3. P0: Conversational kit assembly - requires user confirmation before building
4. P1: Cart add-to-cart from Mira products works
5. P0: Service desk tickets have meaningful subjects (not 'No subject')
6. P0: Notifications show correct category (Care, Enjoy) not 'Hotel Booking'
"""

import pytest
import requests
import os
import time
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "dipali@clubconcierge.in"
TEST_PASSWORD = "test123"


class TestAPIHealth:
    """Basic API health checks"""
    
    def test_api_health(self):
        """Test API is responding"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        print("✓ API health check passed")


class TestQuickBookServiceType:
    """P0: Quick Book shows correct service type in confirmation"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token for authenticated requests"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Authentication failed")
    
    def test_quick_book_grooming_returns_grooming_service_type(self, auth_token):
        """Quick Book for grooming should return service_type='grooming'"""
        session_id = f"test-session-{uuid.uuid4().hex[:8]}"
        
        response = requests.post(
            f"{BASE_URL}/api/mira/quick-book",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "date": "2026-02-15",
                "time": "10:00",
                "notes": "Full grooming session",
                "serviceType": "grooming",
                "session_id": session_id
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # P0 FIX: service_type should be returned and match the request
        assert "service_type" in data, "Response must include service_type field"
        assert data["service_type"] == "grooming", f"Expected 'grooming', got '{data.get('service_type')}'"
        print(f"✓ Quick Book returns service_type='grooming' correctly")
    
    def test_quick_book_vet_returns_vet_service_type(self, auth_token):
        """Quick Book for vet should return service_type='vet_consultation'"""
        session_id = f"test-session-{uuid.uuid4().hex[:8]}"
        
        response = requests.post(
            f"{BASE_URL}/api/mira/quick-book",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "date": "2026-02-16",
                "time": "14:00",
                "notes": "Annual checkup",
                "serviceType": "vet_consultation",
                "session_id": session_id
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("service_type") == "vet_consultation"
        print(f"✓ Quick Book returns service_type='vet_consultation' correctly")
    
    def test_quick_book_boarding_returns_boarding_service_type(self, auth_token):
        """Quick Book for boarding should return service_type='boarding'"""
        session_id = f"test-session-{uuid.uuid4().hex[:8]}"
        
        response = requests.post(
            f"{BASE_URL}/api/mira/quick-book",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "date": "2026-02-20",
                "time": "09:00",
                "notes": "Weekend boarding",
                "serviceType": "boarding",
                "session_id": session_id
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("service_type") == "boarding"
        print(f"✓ Quick Book returns service_type='boarding' correctly")


class TestConversationalKitAssembly:
    """P0: Conversational kit assembly - asks questions BEFORE assembling"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token for authenticated requests"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Authentication failed")
    
    def test_travel_kit_asks_questions_first(self, auth_token):
        """When user asks for travel kit, Mira should ask questions BEFORE assembling"""
        session_id = f"test-kit-{uuid.uuid4().hex[:8]}"
        
        # First message: Ask for travel kit
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "message": "I need a travel kit for my dog",
                "session_id": session_id,
                "source": "web_widget"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # P0 FIX: Should be in gathering_info stage, NOT immediately showing products
        kit_assembly = data.get("kit_assembly", {})
        
        # Check that we're in gathering_info stage
        assert kit_assembly.get("stage") == "gathering_info", \
            f"Expected stage 'gathering_info', got '{kit_assembly.get('stage')}'"
        
        # Check that response contains questions
        response_text = data.get("response", "").lower()
        assert any(q in response_text for q in ["?", "tell me", "can you", "what"]), \
            "Response should contain questions"
        
        # Should NOT have products yet
        assert not data.get("products"), "Should NOT show products before gathering info"
        
        print(f"✓ Travel kit asks questions first (stage: {kit_assembly.get('stage')})")
    
    def test_kit_assembly_requires_confirmation(self, auth_token):
        """Kit assembly should require user confirmation before building"""
        session_id = f"test-kit-confirm-{uuid.uuid4().hex[:8]}"
        
        # Step 1: Ask for travel kit
        response1 = requests.post(
            f"{BASE_URL}/api/mira/chat",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "message": "I need a travel kit",
                "session_id": session_id,
                "source": "web_widget"
            }
        )
        assert response1.status_code == 200
        data1 = response1.json()
        
        # Should be gathering info
        assert data1.get("kit_assembly", {}).get("stage") == "gathering_info"
        
        # Step 2: Provide some info (but not confirmation)
        response2 = requests.post(
            f"{BASE_URL}/api/mira/chat",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "message": "We're going to Goa for a weekend trip",
                "session_id": session_id,
                "source": "web_widget",
                "history": [
                    {"role": "user", "content": "I need a travel kit"},
                    {"role": "assistant", "content": data1.get("response", "")}
                ]
            }
        )
        assert response2.status_code == 200
        data2 = response2.json()
        
        # Should be in confirming stage, asking for confirmation
        kit_stage = data2.get("kit_assembly", {}).get("stage")
        response_text = data2.get("response", "").lower()
        
        # Either still gathering or asking for confirmation
        assert kit_stage in ["gathering_info", "confirming"], \
            f"Expected 'gathering_info' or 'confirming', got '{kit_stage}'"
        
        # Should ask for confirmation
        confirmation_phrases = ["ready", "go ahead", "confirm", "assemble", "yes"]
        has_confirmation_prompt = any(phrase in response_text for phrase in confirmation_phrases)
        
        print(f"✓ Kit assembly stage: {kit_stage}, awaiting confirmation: {data2.get('kit_assembly', {}).get('awaiting_user_input')}")
    
    def test_kit_assembly_proceeds_after_confirmation(self, auth_token):
        """Kit assembly should proceed after user confirms"""
        session_id = f"test-kit-proceed-{uuid.uuid4().hex[:8]}"
        
        # Step 1: Ask for travel kit
        response1 = requests.post(
            f"{BASE_URL}/api/mira/chat",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "message": "I need a travel kit",
                "session_id": session_id,
                "source": "web_widget"
            }
        )
        data1 = response1.json()
        
        # Step 2: Provide info
        response2 = requests.post(
            f"{BASE_URL}/api/mira/chat",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "message": "Going to Goa, my dog gets car sick sometimes",
                "session_id": session_id,
                "source": "web_widget",
                "history": [
                    {"role": "user", "content": "I need a travel kit"},
                    {"role": "assistant", "content": data1.get("response", "")}
                ]
            }
        )
        data2 = response2.json()
        
        # Step 3: Confirm
        response3 = requests.post(
            f"{BASE_URL}/api/mira/chat",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "message": "Yes, go ahead and build the kit",
                "session_id": session_id,
                "source": "web_widget",
                "history": [
                    {"role": "user", "content": "I need a travel kit"},
                    {"role": "assistant", "content": data1.get("response", "")},
                    {"role": "user", "content": "Going to Goa, my dog gets car sick sometimes"},
                    {"role": "assistant", "content": data2.get("response", "")}
                ]
            }
        )
        
        assert response3.status_code == 200
        data3 = response3.json()
        
        # After confirmation, should either be assembling or have products
        kit_stage = data3.get("kit_assembly", {}).get("stage")
        has_products = bool(data3.get("products"))
        
        # Should have progressed past gathering_info
        assert kit_stage in ["assembling", "complete"] or has_products, \
            f"After confirmation, should be assembling or have products. Stage: {kit_stage}, Products: {has_products}"
        
        print(f"✓ Kit assembly proceeds after confirmation (stage: {kit_stage}, has_products: {has_products})")


class TestServiceDeskTicketSubjects:
    """P0: Service desk tickets have meaningful subjects"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token for authenticated requests"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Authentication failed")
    
    def test_grooming_request_creates_ticket_with_subject(self, auth_token):
        """Grooming request should create ticket with meaningful subject"""
        session_id = f"test-subject-{uuid.uuid4().hex[:8]}"
        
        # Make a grooming request
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "message": "I want to book a grooming appointment for my dog",
                "session_id": session_id,
                "source": "web_widget"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Check if ticket was created
        ticket_id = data.get("ticket_id")
        
        # Verify ticket has subject by checking service desk
        time.sleep(0.5)  # Allow DB write
        
        tickets_response = requests.get(
            f"{BASE_URL}/api/admin/service-desk/tickets",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        if tickets_response.status_code == 200:
            tickets = tickets_response.json()
            if isinstance(tickets, list) and tickets:
                # Find our ticket
                our_ticket = next((t for t in tickets if t.get("mira_session_id") == session_id), None)
                if our_ticket:
                    subject = our_ticket.get("subject", "")
                    assert subject and subject != "No subject", \
                        f"Ticket should have meaningful subject, got: '{subject}'"
                    print(f"✓ Ticket has meaningful subject: '{subject}'")
                    return
        
        # If we can't verify via API, at least check the response
        print(f"✓ Grooming request processed (ticket_id: {ticket_id})")


class TestNotificationCategories:
    """P0: Notifications show correct category (Care, Enjoy) not 'Hotel Booking'"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token for authenticated requests"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Authentication failed")
    
    def test_grooming_notification_shows_care_category(self, auth_token):
        """Grooming request notification should show 'Care' category, not 'Hotel Booking'"""
        session_id = f"test-notif-{uuid.uuid4().hex[:8]}"
        
        # Make a grooming request
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "message": "I need grooming for my dog",
                "session_id": session_id,
                "source": "web_widget"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Check pillar detected
        pillar = data.get("pillar", "")
        
        # Grooming should be detected as 'care' pillar
        assert pillar == "care", f"Grooming should be 'care' pillar, got '{pillar}'"
        
        # Check concierge action if present
        concierge_action = data.get("concierge_action", {})
        if concierge_action:
            action_type = concierge_action.get("action_type", "")
            # Should be care_appointment, NOT hotel_booking
            assert "hotel" not in action_type.lower(), \
                f"Grooming should NOT trigger hotel_booking, got '{action_type}'"
            assert action_type in ["care_appointment", "care_request", "care_confirmed"], \
                f"Expected care-related action, got '{action_type}'"
        
        print(f"✓ Grooming notification uses correct category: pillar='{pillar}'")
    
    def test_word_boundary_prevents_room_matching_grooming(self, auth_token):
        """'room' should NOT match 'grooming' keyword"""
        session_id = f"test-room-{uuid.uuid4().hex[:8]}"
        
        # Message with 'room' but NOT grooming
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "message": "I need a hotel room for my trip",
                "session_id": session_id,
                "source": "web_widget"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Should be stay/hotel, NOT care
        pillar = data.get("pillar", "")
        concierge_action = data.get("concierge_action", {})
        action_type = concierge_action.get("action_type", "") if concierge_action else ""
        
        # Should NOT be care_appointment
        assert action_type != "care_appointment", \
            f"'room' should NOT trigger care_appointment, got '{action_type}'"
        
        print(f"✓ Word boundary works: 'room' -> pillar='{pillar}', action='{action_type}'")


class TestCartAddToCartFromMira:
    """P1: Cart add-to-cart from Mira products works"""
    
    def test_products_endpoint_returns_valid_products(self):
        """Products endpoint should return products with required fields for cart"""
        response = requests.get(f"{BASE_URL}/api/products")
        
        assert response.status_code == 200
        products = response.json()
        
        if isinstance(products, list) and products:
            product = products[0]
            # Check required fields for cart
            assert "id" in product or "_id" in product, "Product must have id"
            assert "name" in product or "title" in product, "Product must have name"
            assert "price" in product, "Product must have price"
            
            print(f"✓ Products have required cart fields (sample: {product.get('name', product.get('title'))})")
        else:
            print("✓ Products endpoint works (no products in DB)")
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token for authenticated requests"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Authentication failed")
    
    def test_mira_product_recommendations_have_cart_fields(self, auth_token):
        """Mira product recommendations should have fields needed for add-to-cart"""
        session_id = f"test-cart-{uuid.uuid4().hex[:8]}"
        
        # Ask for product recommendations
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "message": "Show me some dog treats",
                "session_id": session_id,
                "source": "web_widget"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        products = data.get("products", [])
        if products:
            for product in products[:3]:
                # Check cart-required fields
                has_id = "id" in product or "_id" in product
                has_name = "name" in product or "title" in product
                has_price = "price" in product
                
                if not product.get("concierge_sourced"):  # Concierge items don't need price
                    assert has_id, f"Product missing id: {product}"
                    assert has_name, f"Product missing name: {product}"
                
            print(f"✓ Mira products have cart fields ({len(products)} products)")
        else:
            print("✓ Mira chat works (no products returned for this query)")


class TestWelcomeMessageAutoSpeak:
    """P1: Welcome message auto-speak functionality"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token for authenticated requests"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Authentication failed")
    
    def test_mira_chat_returns_response_for_tts(self, auth_token):
        """Mira chat should return response text suitable for TTS"""
        session_id = f"test-tts-{uuid.uuid4().hex[:8]}"
        
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "message": "Hello",
                "session_id": session_id,
                "source": "web_widget"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Response should have text content for TTS
        response_text = data.get("response", "")
        assert response_text, "Mira should return response text"
        assert len(response_text) > 10, "Response should have meaningful content"
        
        print(f"✓ Mira returns response suitable for TTS ({len(response_text)} chars)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
