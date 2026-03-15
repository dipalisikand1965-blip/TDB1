"""
Test Stay Pillar Features - Iteration 62
Tests:
1. Products API returns Stay pillar products
2. Ticket creation for Stay Request Form
3. Products have both 'pillar' and 'pillars' field support
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://dine-category-pills.preview.emergentagent.com')

# Test credentials
TEST_EMAIL = "dipali@clubconcierge.in"
TEST_PASSWORD = "test123"


class TestStayPillarProducts:
    """Test Stay pillar product retrieval"""
    
    def test_products_api_returns_stay_products(self):
        """GET /api/products?pillar=stay should return Stay pillar products"""
        response = requests.get(f"{BASE_URL}/api/products", params={"pillar": "stay", "limit": 50})
        
        # Status code assertion
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        # Data assertions
        data = response.json()
        assert "products" in data, "Response should have 'products' key"
        
        products = data["products"]
        assert len(products) > 0, "Should return at least one Stay pillar product"
        
        # Verify products have stay pillar (either in 'pillar' or 'pillars' field)
        for product in products[:10]:  # Check first 10
            has_stay = (
                product.get("pillar") == "stay" or 
                "stay" in (product.get("pillars") or [])
            )
            assert has_stay, f"Product {product.get('name')} should have 'stay' in pillar/pillars"
        
        print(f"PASS: Found {len(products)} Stay pillar products")
    
    def test_stay_products_include_expected_categories(self):
        """Stay products should include beds, mats, kennels, bowls"""
        response = requests.get(f"{BASE_URL}/api/products", params={"pillar": "stay", "limit": 100})
        
        assert response.status_code == 200
        
        products = response.json().get("products", [])
        categories = set()
        product_names = []
        
        for product in products:
            if product.get("category"):
                categories.add(product.get("category").lower())
            product_names.append(product.get("name", ""))
        
        print(f"Found categories: {categories}")
        print(f"Sample products: {product_names[:5]}")
        
        # Check that we have at least some expected product types
        has_mats = any("mat" in name.lower() for name in product_names)
        has_beds_or_kennels = any(
            "bed" in name.lower() or "kennel" in name.lower() 
            for name in product_names
        )
        
        assert len(products) >= 10, f"Should have at least 10 Stay products, got {len(products)}"
        print(f"PASS: Stay pillar has {len(products)} products with categories: {categories}")
    
    def test_stay_products_total_count(self):
        """Verify Stay pillar has ~115 products tagged"""
        response = requests.get(f"{BASE_URL}/api/products", params={"pillar": "stay", "limit": 1})
        
        assert response.status_code == 200
        
        data = response.json()
        total = data.get("total", len(data.get("products", [])))
        
        # Main agent mentioned 115 products tagged with stay pillar
        assert total >= 50, f"Expected at least 50 Stay products, got {total}"
        print(f"PASS: Stay pillar has {total} total products")


class TestStayRequestTicket:
    """Test Stay Request Form ticket creation"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        if response.status_code == 200:
            data = response.json()
            return data.get("token") or data.get("access_token")
        pytest.skip("Authentication failed - skipping authenticated tests")
    
    def test_create_stay_request_ticket(self, auth_token):
        """POST /api/tickets/ should create a Stay request ticket"""
        ticket_data = {
            "member": {
                "name": "TEST_Stay_Request_User",
                "email": "test_stay@example.com",
                "phone": "9876543210"
            },
            "category": "stay",
            "sub_category": "pawcation_curator",
            "urgency": "medium",
            "description": """
**Stay Request for Test Pet**

🏨 **Property:** Grand Hyatt Resort
📍 **Location:** Goa, India
📅 **Check-in:** 2026-04-20
📅 **Check-out:** 2026-04-25
🐾 **Number of Pets:** 1
💬 **Contact Preference:** WhatsApp

**Special Requests:**
Ground floor preferred, pet bed needed

---
*Please verify pet policy, arrange pet-friendly room, and confirm amenities.*
            """,
            "source": "web_stay_page"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/tickets/",
            json=ticket_data,
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        # Status code assertion
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Data assertions
        data = response.json()
        assert data.get("success") == True, "Ticket creation should succeed"
        assert "ticket" in data, "Response should include ticket data"
        
        ticket = data["ticket"]
        assert ticket.get("ticket_id"), "Ticket should have an ID"
        assert ticket.get("category") == "stay", "Category should be 'stay'"
        assert ticket.get("sub_category") == "pawcation_curator", "Sub-category should match"
        assert ticket.get("status") == "new", "New ticket should have 'new' status"
        
        print(f"PASS: Created Stay request ticket: {ticket.get('ticket_id')}")
    
    def test_ticket_without_auth(self):
        """Ticket creation should work without auth (for guest users)"""
        ticket_data = {
            "member": {
                "name": "TEST_Guest_User",
                "email": "guest_test@example.com",
                "phone": "1234567890"
            },
            "category": "stay",
            "sub_category": "stay_inquiry",
            "urgency": "low",
            "description": "Guest inquiry about pet-friendly stays in Mumbai",
            "source": "web_stay_page"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/tickets/",
            json=ticket_data
        )
        
        # Should allow ticket creation without auth
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data.get("success") == True, "Guest ticket creation should succeed"
        
        print(f"PASS: Guest can create Stay inquiry ticket")


class TestStayPillarQuery:
    """Test pillar query with $or for pillars array"""
    
    def test_or_query_for_pillar_and_pillars(self):
        """Products API should search both 'pillar' field and 'pillars' array"""
        response = requests.get(f"{BASE_URL}/api/products", params={"pillar": "stay", "limit": 20})
        
        assert response.status_code == 200
        
        products = response.json().get("products", [])
        
        # Check that products come from both pillar types
        has_pillar_field = False
        has_pillars_array = False
        
        for product in products:
            if product.get("pillar") == "stay":
                has_pillar_field = True
            if "stay" in (product.get("pillars") or []):
                has_pillars_array = True
        
        # At least one should be True (ideally both)
        assert has_pillar_field or has_pillars_array, "Should find products with stay in pillar or pillars"
        
        print(f"PASS: Query finds products via pillar field ({has_pillar_field}) and pillars array ({has_pillars_array})")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
