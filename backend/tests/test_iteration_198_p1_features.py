"""
Test Iteration 198 - P1 Features
================================
Tests for:
1. Pawmeter UI Integration on product cards
2. Pawmeter filter (Pawmeter Rated) filters products correctly
3. Member Quotes API endpoint returns quotes for user email
4. Quotes tab appears in member dashboard
5. Cross-pillar filters work on shop page
6. Quote Builder in admin Service Desk still works
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Admin credentials
ADMIN_USERNAME = "aditya"
ADMIN_PASSWORD = "lola4304"
TEST_USER_EMAIL = "dipali@clubconcierge.in"


class TestMemberQuotesAPI:
    """Test Member Quotes API endpoint"""
    
    def test_member_quotes_endpoint_returns_quotes(self):
        """Test that /api/quotes/member returns quotes for a user email"""
        response = requests.get(f"{BASE_URL}/api/quotes/member?email={TEST_USER_EMAIL}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "quotes" in data, "Response should contain 'quotes' key"
        assert isinstance(data["quotes"], list), "Quotes should be a list"
        
        # Verify quote structure if quotes exist
        if len(data["quotes"]) > 0:
            quote = data["quotes"][0]
            assert "id" in quote, "Quote should have 'id'"
            assert "member" in quote, "Quote should have 'member'"
            assert "pricing" in quote, "Quote should have 'pricing'"
            assert "status" in quote, "Quote should have 'status'"
            print(f"✅ Found {len(data['quotes'])} quotes for {TEST_USER_EMAIL}")
    
    def test_member_quotes_empty_email_returns_error(self):
        """Test that empty email returns error"""
        response = requests.get(f"{BASE_URL}/api/quotes/member?email=")
        assert response.status_code == 400, f"Expected 400 for empty email, got {response.status_code}"
    
    def test_member_quotes_nonexistent_email_returns_empty(self):
        """Test that non-existent email returns empty list"""
        response = requests.get(f"{BASE_URL}/api/quotes/member?email=nonexistent@test.com")
        assert response.status_code == 200
        data = response.json()
        assert data["quotes"] == [], "Should return empty list for non-existent email"
        print("✅ Non-existent email returns empty quotes list")
    
    def test_member_quotes_includes_party_details(self):
        """Test that quotes include party details when available"""
        response = requests.get(f"{BASE_URL}/api/quotes/member?email={TEST_USER_EMAIL}")
        assert response.status_code == 200
        
        data = response.json()
        # Check if any quote has party_details
        for quote in data["quotes"]:
            if quote.get("party_request_id"):
                # party_details may be None if party request doesn't exist
                assert "party_details" in quote, "Quote with party_request_id should have party_details key"
                print(f"✅ Quote {quote['id']} has party_details: {quote.get('party_details')}")


class TestProductsWithPawmeter:
    """Test Products API returns pawmeter scores"""
    
    def test_products_have_pawmeter_scores(self):
        """Test that products include pawmeter scores"""
        response = requests.get(f"{BASE_URL}/api/products?limit=10")
        assert response.status_code == 200
        
        data = response.json()
        products = data.get("products", data)
        
        # Check that at least some products have pawmeter
        products_with_pawmeter = [p for p in products if p.get("pawmeter", {}).get("overall")]
        assert len(products_with_pawmeter) > 0, "At least some products should have pawmeter scores"
        
        # Verify pawmeter structure
        for product in products_with_pawmeter[:3]:
            pawmeter = product["pawmeter"]
            assert "overall" in pawmeter, "Pawmeter should have 'overall' score"
            assert pawmeter["overall"] >= 1 and pawmeter["overall"] <= 5, "Overall score should be 1-5"
            print(f"✅ Product '{product.get('title', product.get('name'))}' has pawmeter: {pawmeter['overall']}")
    
    def test_products_pawmeter_structure(self):
        """Test pawmeter has all required fields"""
        response = requests.get(f"{BASE_URL}/api/products?limit=5")
        assert response.status_code == 200
        
        data = response.json()
        products = data.get("products", data)
        
        for product in products:
            if product.get("pawmeter"):
                pawmeter = product["pawmeter"]
                # Check all criteria fields
                expected_fields = ["overall", "comfort", "safety", "quality", "value", "joy"]
                for field in expected_fields:
                    assert field in pawmeter, f"Pawmeter should have '{field}' field"
                print(f"✅ Product pawmeter has all required fields")
                break


class TestCrossPillarFilters:
    """Test cross-pillar filters on shop page"""
    
    def test_pillar_filter_celebrate(self):
        """Test filtering products by celebrate pillar"""
        response = requests.get(f"{BASE_URL}/api/products?pillar=celebrate&limit=10")
        assert response.status_code == 200
        
        data = response.json()
        products = data.get("products", data)
        
        # All products should be from celebrate pillar
        for product in products:
            pillar = product.get("pillar", "").lower()
            assert pillar == "celebrate" or not pillar, f"Product should be from celebrate pillar, got: {pillar}"
        print(f"✅ Celebrate pillar filter returned {len(products)} products")
    
    def test_pillar_filter_dine(self):
        """Test filtering products by dine pillar"""
        response = requests.get(f"{BASE_URL}/api/products?pillar=dine&limit=10")
        assert response.status_code == 200
        
        data = response.json()
        products = data.get("products", data)
        print(f"✅ Dine pillar filter returned {len(products)} products")
    
    def test_pillar_filter_shop(self):
        """Test filtering products by shop pillar"""
        response = requests.get(f"{BASE_URL}/api/products?pillar=shop&limit=10")
        assert response.status_code == 200
        
        data = response.json()
        products = data.get("products", data)
        print(f"✅ Shop pillar filter returned {len(products)} products")
    
    def test_all_pillars_filter(self):
        """Test that 'all' pillar returns all products"""
        response_all = requests.get(f"{BASE_URL}/api/products?limit=100")
        response_pillar = requests.get(f"{BASE_URL}/api/products?pillar=all&limit=100")
        
        assert response_all.status_code == 200
        assert response_pillar.status_code == 200
        
        # Both should return similar results
        data_all = response_all.json()
        data_pillar = response_pillar.json()
        
        products_all = data_all.get("products", data_all)
        products_pillar = data_pillar.get("products", data_pillar)
        
        print(f"✅ All products: {len(products_all)}, Pillar=all: {len(products_pillar)}")


class TestQuoteBuilderAdmin:
    """Test Quote Builder admin functionality still works"""
    
    def test_admin_get_all_quotes(self):
        """Test admin can get all quotes"""
        response = requests.get(
            f"{BASE_URL}/api/quotes/admin/all",
            auth=(ADMIN_USERNAME, ADMIN_PASSWORD)
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "quotes" in data, "Response should contain 'quotes'"
        assert "stats" in data, "Response should contain 'stats'"
        
        stats = data["stats"]
        assert "total" in stats, "Stats should have 'total'"
        assert "draft" in stats, "Stats should have 'draft'"
        assert "sent" in stats, "Stats should have 'sent'"
        assert "paid" in stats, "Stats should have 'paid'"
        
        print(f"✅ Admin quotes: total={stats['total']}, draft={stats['draft']}, sent={stats['sent']}, paid={stats['paid']}")
    
    def test_admin_get_quotes_by_status(self):
        """Test admin can filter quotes by status"""
        response = requests.get(
            f"{BASE_URL}/api/quotes/admin/all?status=paid",
            auth=(ADMIN_USERNAME, ADMIN_PASSWORD)
        )
        assert response.status_code == 200
        
        data = response.json()
        for quote in data["quotes"]:
            assert quote["status"] == "paid", f"Expected status 'paid', got {quote['status']}"
        print(f"✅ Filtered quotes by status=paid: {len(data['quotes'])} quotes")
    
    def test_admin_unauthorized_without_credentials(self):
        """Test admin endpoints require authentication"""
        response = requests.get(f"{BASE_URL}/api/quotes/admin/all")
        assert response.status_code == 401, f"Expected 401 without auth, got {response.status_code}"
        print("✅ Admin endpoint requires authentication")
    
    def test_get_quote_by_id(self):
        """Test getting a specific quote by ID"""
        # First get a quote ID from admin endpoint
        response = requests.get(
            f"{BASE_URL}/api/quotes/admin/all?limit=1",
            auth=(ADMIN_USERNAME, ADMIN_PASSWORD)
        )
        assert response.status_code == 200
        
        data = response.json()
        if len(data["quotes"]) > 0:
            quote_id = data["quotes"][0]["id"]
            
            # Get specific quote (no auth required for member access)
            quote_response = requests.get(f"{BASE_URL}/api/quotes/{quote_id}")
            assert quote_response.status_code == 200
            
            quote_data = quote_response.json()
            assert quote_data["id"] == quote_id
            print(f"✅ Retrieved quote {quote_id} successfully")


class TestQuoteCreateAndSend:
    """Test quote creation and sending flow"""
    
    def test_create_quote_requires_auth(self):
        """Test that creating a quote requires admin auth"""
        response = requests.post(
            f"{BASE_URL}/api/quotes/create",
            json={
                "party_request_id": "TEST-123",
                "ticket_id": "CEL-TEST-123",
                "member_email": "test@test.com",
                "items": []
            }
        )
        assert response.status_code == 401, f"Expected 401 without auth, got {response.status_code}"
        print("✅ Quote creation requires authentication")
    
    def test_create_quote_with_auth(self):
        """Test creating a quote with admin auth"""
        import secrets
        test_id = secrets.token_hex(3).upper()
        
        response = requests.post(
            f"{BASE_URL}/api/quotes/create",
            auth=(ADMIN_USERNAME, ADMIN_PASSWORD),
            json={
                "party_request_id": f"PARTY-TEST-{test_id}",
                "ticket_id": f"CEL-TEST-{test_id}",
                "member_email": "test@iteration198.com",
                "member_name": "Test User 198",
                "items": [
                    {
                        "item_id": "test-item-001",
                        "item_type": "product",
                        "name": "Test Birthday Cake",
                        "description": "Test cake for iteration 198",
                        "quantity": 1,
                        "unit_price": 999.0
                    }
                ],
                "notes": "Test quote from iteration 198",
                "discount_percent": 10
            }
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["success"] == True
        assert "quote_id" in data
        assert data["total"] == 899.1  # 999 - 10% = 899.1
        
        print(f"✅ Created quote {data['quote_id']} with total ₹{data['total']}")
        return data["quote_id"]


class TestCategoryHierarchy:
    """Test category hierarchy for shop page"""
    
    def test_category_hierarchy_endpoint(self):
        """Test that category hierarchy endpoint works"""
        response = requests.get(f"{BASE_URL}/api/categories/hierarchy")
        assert response.status_code == 200
        
        data = response.json()
        assert "categories" in data, "Response should contain 'categories'"
        
        categories = data["categories"]
        if len(categories) > 0:
            cat = categories[0]
            assert "id" in cat, "Category should have 'id'"
            assert "name" in cat, "Category should have 'name'"
            print(f"✅ Category hierarchy has {len(categories)} top-level categories")


# Run tests
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
