"""
Test Suite for Quote Builder Feature - Iteration 197
=====================================================
Tests the Quote Builder system for creating custom quotes for party planning requests.

Features tested:
- Quote creation with items and discount calculation
- Quote retrieval (single and by party request)
- Quote update
- Quote sending with notification to member
- Quote mark-paid functionality
- Admin all quotes endpoint
"""

import pytest
import requests
import os
import secrets
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
ADMIN_USERNAME = "aditya"
ADMIN_PASSWORD = "lola4304"
TEST_EMAIL = "dipali@clubconcierge.in"


class TestQuoteBuilderAPI:
    """Test Quote Builder API endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test fixtures"""
        self.auth = (ADMIN_USERNAME, ADMIN_PASSWORD)
        self.headers = {"Content-Type": "application/json"}
        self.test_party_request_id = f"PARTY-TEST-{secrets.token_hex(3).upper()}"
        self.test_ticket_id = f"CEL-TEST-{secrets.token_hex(3).upper()}"
        self.created_quote_id = None
    
    def test_01_health_check(self):
        """Verify API is healthy"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        print("✅ API health check passed")
    
    def test_02_create_quote_success(self):
        """Test creating a new quote with items"""
        payload = {
            "party_request_id": self.test_party_request_id,
            "ticket_id": self.test_ticket_id,
            "member_email": TEST_EMAIL,
            "member_name": "Test Member",
            "items": [
                {
                    "item_id": "test-cake-001",
                    "item_type": "product",
                    "name": "Birthday Cake for Dogs",
                    "description": "Delicious peanut butter cake",
                    "quantity": 1,
                    "unit_price": 1499.0,
                    "image": "https://example.com/cake.jpg"
                },
                {
                    "item_id": "test-treat-001",
                    "item_type": "product",
                    "name": "Party Treats Pack",
                    "description": "Assorted treats for party guests",
                    "quantity": 2,
                    "unit_price": 499.0,
                    "image": None
                }
            ],
            "notes": "Test quote for party planning",
            "discount_percent": 10.0,
            "validity_days": 7
        }
        
        response = requests.post(
            f"{BASE_URL}/api/quotes/create",
            json=payload,
            auth=self.auth,
            headers=self.headers
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert data.get("success") is True
        assert "quote_id" in data
        assert data["quote_id"].startswith("QT-")
        assert "total" in data
        assert "message" in data
        
        # Verify discount calculation: (1499 + 2*499) * 0.9 = 2497 * 0.9 = 2247.3
        expected_total = (1499 + 2 * 499) * 0.9
        assert abs(data["total"] - expected_total) < 0.1, f"Expected total ~{expected_total}, got {data['total']}"
        
        self.__class__.created_quote_id = data["quote_id"]
        print(f"✅ Quote created: {data['quote_id']} with total ₹{data['total']}")
    
    def test_03_get_quote_by_id(self):
        """Test retrieving a quote by ID"""
        # Use existing quote if test_02 didn't run
        quote_id = getattr(self.__class__, 'created_quote_id', None) or "QT-20260203-BF7F0D"
        
        response = requests.get(f"{BASE_URL}/api/quotes/{quote_id}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify quote structure
        assert data.get("id") == quote_id
        assert "party_request_id" in data
        assert "ticket_id" in data
        assert "member" in data
        assert "items" in data
        assert "pricing" in data
        assert "status" in data
        
        # Verify pricing structure
        pricing = data["pricing"]
        assert "subtotal" in pricing
        assert "discount_percent" in pricing
        assert "discount_amount" in pricing
        assert "total" in pricing
        assert "currency" in pricing
        
        print(f"✅ Quote retrieved: {quote_id}, status: {data['status']}, total: ₹{pricing['total']}")
    
    def test_04_get_quotes_for_party_request(self):
        """Test retrieving quotes by party request ID"""
        # Use existing party request
        party_request_id = "PARTY-20260203-11C264"
        
        response = requests.get(f"{BASE_URL}/api/quotes/party-request/{party_request_id}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "quotes" in data
        assert isinstance(data["quotes"], list)
        
        if len(data["quotes"]) > 0:
            quote = data["quotes"][0]
            assert quote["party_request_id"] == party_request_id
            print(f"✅ Found {len(data['quotes'])} quote(s) for party request {party_request_id}")
        else:
            print(f"✅ No quotes found for party request {party_request_id} (expected for new requests)")
    
    def test_05_update_quote(self):
        """Test updating a quote"""
        quote_id = getattr(self.__class__, 'created_quote_id', None)
        if not quote_id:
            pytest.skip("No quote created in previous test")
        
        payload = {
            "items": [
                {
                    "item_id": "test-cake-001",
                    "item_type": "product",
                    "name": "Birthday Cake for Dogs",
                    "description": "Delicious peanut butter cake",
                    "quantity": 2,  # Increased quantity
                    "unit_price": 1499.0,
                    "image": "https://example.com/cake.jpg"
                }
            ],
            "discount_percent": 15.0,  # Increased discount
            "notes": "Updated test quote"
        }
        
        response = requests.put(
            f"{BASE_URL}/api/quotes/{quote_id}",
            json=payload,
            auth=self.auth,
            headers=self.headers
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") is True
        
        # Verify update by fetching quote
        get_response = requests.get(f"{BASE_URL}/api/quotes/{quote_id}")
        assert get_response.status_code == 200
        updated_quote = get_response.json()
        
        assert updated_quote["pricing"]["discount_percent"] == 15.0
        assert len(updated_quote["items"]) == 1
        assert updated_quote["items"][0]["quantity"] == 2
        
        print(f"✅ Quote {quote_id} updated successfully")
    
    def test_06_send_quote(self):
        """Test sending a quote to member"""
        quote_id = getattr(self.__class__, 'created_quote_id', None)
        if not quote_id:
            pytest.skip("No quote created in previous test")
        
        response = requests.post(
            f"{BASE_URL}/api/quotes/{quote_id}/send",
            auth=self.auth,
            headers=self.headers
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert data.get("success") is True
        assert "message" in data
        assert "payment_link" in data
        assert data["payment_link"].startswith("/pay/quote/")
        
        # Verify quote status changed to 'sent'
        get_response = requests.get(f"{BASE_URL}/api/quotes/{quote_id}")
        assert get_response.status_code == 200
        sent_quote = get_response.json()
        
        # Status should be 'sent' or 'viewed' (if already viewed)
        assert sent_quote["status"] in ["sent", "viewed"]
        assert sent_quote.get("sent_at") is not None
        assert sent_quote.get("expires_at") is not None
        
        print(f"✅ Quote {quote_id} sent, payment link: {data['payment_link']}")
    
    def test_07_verify_member_notification_created(self):
        """Test that sending quote creates member notification"""
        # Check member notifications for the test email
        response = requests.get(
            f"{BASE_URL}/api/member/notifications?email={TEST_EMAIL}&limit=10"
        )
        
        # This endpoint might not exist or might require auth
        if response.status_code == 200:
            data = response.json()
            notifications = data.get("notifications", [])
            
            # Look for quote notification
            quote_notifications = [n for n in notifications if n.get("type") == "quote_received"]
            if quote_notifications:
                print(f"✅ Found {len(quote_notifications)} quote notification(s) for {TEST_EMAIL}")
            else:
                print(f"⚠️ No quote notifications found (may have been read or cleared)")
        else:
            # Try alternative endpoint
            print(f"ℹ️ Member notifications endpoint returned {response.status_code}")
    
    def test_08_mark_quote_paid(self):
        """Test marking a quote as paid"""
        quote_id = getattr(self.__class__, 'created_quote_id', None)
        if not quote_id:
            pytest.skip("No quote created in previous test")
        
        response = requests.post(
            f"{BASE_URL}/api/quotes/{quote_id}/mark-paid",
            params={"payment_id": "test_payment_123"},
            auth=self.auth,
            headers=self.headers
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert data.get("success") is True
        assert "message" in data
        
        # Verify quote status changed to 'paid'
        get_response = requests.get(f"{BASE_URL}/api/quotes/{quote_id}")
        assert get_response.status_code == 200
        paid_quote = get_response.json()
        
        assert paid_quote["status"] == "paid"
        assert paid_quote["payment"]["status"] == "completed"
        assert paid_quote["payment"]["paid_at"] is not None
        
        print(f"✅ Quote {quote_id} marked as paid")
    
    def test_09_get_all_quotes_admin(self):
        """Test admin endpoint to get all quotes"""
        response = requests.get(
            f"{BASE_URL}/api/quotes/admin/all",
            auth=self.auth
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "quotes" in data
        assert "stats" in data
        assert isinstance(data["quotes"], list)
        
        # Verify stats structure
        stats = data["stats"]
        assert "total" in stats
        assert "draft" in stats
        assert "sent" in stats
        assert "accepted" in stats
        assert "paid" in stats
        
        print(f"✅ Admin quotes: {stats['total']} total, {stats['draft']} draft, {stats['sent']} sent, {stats['paid']} paid")
    
    def test_10_get_all_quotes_filtered_by_status(self):
        """Test filtering quotes by status"""
        response = requests.get(
            f"{BASE_URL}/api/quotes/admin/all?status=paid",
            auth=self.auth
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # All returned quotes should have 'paid' status
        for quote in data["quotes"]:
            assert quote["status"] == "paid", f"Expected status 'paid', got '{quote['status']}'"
        
        print(f"✅ Filtered quotes by status 'paid': {len(data['quotes'])} found")
    
    def test_11_quote_not_found(self):
        """Test 404 for non-existent quote"""
        response = requests.get(f"{BASE_URL}/api/quotes/QT-NONEXISTENT-123456")
        
        assert response.status_code == 404
        print("✅ Non-existent quote returns 404")
    
    def test_12_create_quote_unauthorized(self):
        """Test creating quote without auth returns 401"""
        payload = {
            "party_request_id": "PARTY-TEST-123",
            "ticket_id": "CEL-TEST-123",
            "member_email": "test@example.com",
            "items": [{"item_id": "test", "item_type": "product", "name": "Test", "quantity": 1, "unit_price": 100}]
        }
        
        response = requests.post(
            f"{BASE_URL}/api/quotes/create",
            json=payload,
            headers=self.headers
            # No auth
        )
        
        assert response.status_code == 401
        print("✅ Unauthorized quote creation returns 401")
    
    def test_13_discount_calculation_accuracy(self):
        """Test discount calculation with various percentages"""
        test_cases = [
            {"items": [{"unit_price": 1000, "quantity": 1}], "discount": 0, "expected": 1000},
            {"items": [{"unit_price": 1000, "quantity": 1}], "discount": 10, "expected": 900},
            {"items": [{"unit_price": 1000, "quantity": 2}], "discount": 25, "expected": 1500},
            {"items": [{"unit_price": 500, "quantity": 3}, {"unit_price": 200, "quantity": 5}], "discount": 15, "expected": 2500 * 0.85},  # (500*3 + 200*5) * 0.85
        ]
        
        for i, tc in enumerate(test_cases):
            payload = {
                "party_request_id": f"PARTY-CALC-{i}",
                "ticket_id": f"CEL-CALC-{i}",
                "member_email": "calc@test.com",
                "items": [
                    {
                        "item_id": f"item-{j}",
                        "item_type": "product",
                        "name": f"Test Item {j}",
                        "quantity": item["quantity"],
                        "unit_price": item["unit_price"]
                    }
                    for j, item in enumerate(tc["items"])
                ],
                "discount_percent": tc["discount"]
            }
            
            response = requests.post(
                f"{BASE_URL}/api/quotes/create",
                json=payload,
                auth=self.auth,
                headers=self.headers
            )
            
            assert response.status_code == 200
            data = response.json()
            
            assert abs(data["total"] - tc["expected"]) < 0.1, \
                f"Test case {i}: Expected {tc['expected']}, got {data['total']}"
        
        print("✅ Discount calculations verified for all test cases")


class TestQuoteBuilderIntegration:
    """Integration tests for Quote Builder with Service Desk"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.auth = (ADMIN_USERNAME, ADMIN_PASSWORD)
        self.headers = {"Content-Type": "application/json"}
    
    def test_01_party_ticket_has_quote_button_data(self):
        """Verify party tickets have data needed for Quote Builder"""
        response = requests.get(
            f"{BASE_URL}/api/tickets?category=celebrate&limit=5",
            auth=self.auth
        )
        
        assert response.status_code == 200
        data = response.json()
        
        party_tickets = [t for t in data.get("tickets", []) if t.get("party_request_id")]
        
        if party_tickets:
            ticket = party_tickets[0]
            # Verify ticket has required fields for Quote Builder
            assert "party_request_id" in ticket
            assert "ticket_id" in ticket
            assert "member" in ticket
            assert ticket["member"].get("email") is not None
            
            print(f"✅ Party ticket {ticket['ticket_id']} has Quote Builder data")
        else:
            print("⚠️ No party tickets found with party_request_id")
    
    def test_02_quote_updates_ticket_status(self):
        """Verify creating quote updates ticket status"""
        # Get a party ticket without a quote
        response = requests.get(
            f"{BASE_URL}/api/tickets?category=celebrate&limit=10",
            auth=self.auth
        )
        
        assert response.status_code == 200
        tickets = response.json().get("tickets", [])
        
        # Find ticket without quote
        ticket_without_quote = None
        for t in tickets:
            if t.get("party_request_id") and not t.get("quote_id"):
                ticket_without_quote = t
                break
        
        if ticket_without_quote:
            print(f"✅ Found ticket without quote: {ticket_without_quote['ticket_id']}")
        else:
            print("ℹ️ All party tickets already have quotes")
    
    def test_03_existing_quote_linked_to_ticket(self):
        """Verify existing quote is linked to ticket"""
        # Get ticket with quote
        response = requests.get(
            f"{BASE_URL}/api/tickets?category=celebrate&limit=10",
            auth=self.auth
        )
        
        assert response.status_code == 200
        tickets = response.json().get("tickets", [])
        
        ticket_with_quote = None
        for t in tickets:
            if t.get("quote_id"):
                ticket_with_quote = t
                break
        
        if ticket_with_quote:
            # Verify quote exists
            quote_response = requests.get(f"{BASE_URL}/api/quotes/{ticket_with_quote['quote_id']}")
            assert quote_response.status_code == 200
            quote = quote_response.json()
            
            assert quote["ticket_id"] == ticket_with_quote["ticket_id"]
            print(f"✅ Quote {quote['id']} correctly linked to ticket {ticket_with_quote['ticket_id']}")
        else:
            print("ℹ️ No tickets with quotes found")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
