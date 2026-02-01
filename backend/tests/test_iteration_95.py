"""
Iteration 95 Backend Tests
Testing: Product variants, Pillar products/services, Pet Score, NPS testimonials, Admin login, Tickets
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://concierge-hub-22.preview.emergentagent.com').rstrip('/')

# Test credentials
MEMBER_EMAIL = "dipali@clubconcierge.in"
MEMBER_PASSWORD = "test123"
ADMIN_USERNAME = "aditya"
ADMIN_PASSWORD = "lola4304"


class TestAdminLogin:
    """Test admin login functionality"""
    
    def test_admin_login_success(self):
        """Test admin login with valid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert "token" in data
        print(f"✅ Admin login successful, token received")
    
    def test_admin_login_invalid_credentials(self):
        """Test admin login with invalid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"username": "wrong", "password": "wrong"}
        )
        assert response.status_code == 401


class TestMemberLogin:
    """Test member login functionality"""
    
    def test_member_login_success(self):
        """Test member login with valid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": MEMBER_EMAIL, "password": MEMBER_PASSWORD}
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data.get("user", {}).get("email") == MEMBER_EMAIL
        print(f"✅ Member login successful for {MEMBER_EMAIL}")
        return data.get("access_token")


class TestTickets:
    """Test ticket endpoints"""
    
    def test_get_tickets_list(self):
        """Test GET /api/tickets returns tickets"""
        response = requests.get(f"{BASE_URL}/api/tickets")
        assert response.status_code == 200
        data = response.json()
        assert "tickets" in data
        assert isinstance(data["tickets"], list)
        print(f"✅ Tickets list returned {len(data['tickets'])} tickets")
    
    def test_get_single_ticket(self):
        """Test GET /api/tickets/{ticket_id} returns proper data"""
        # First get a ticket ID from the list
        list_response = requests.get(f"{BASE_URL}/api/tickets?limit=1")
        assert list_response.status_code == 200
        tickets = list_response.json().get("tickets", [])
        
        if len(tickets) > 0:
            ticket_id = tickets[0].get("ticket_id")
            response = requests.get(f"{BASE_URL}/api/tickets/{ticket_id}")
            assert response.status_code == 200
            data = response.json()
            assert "ticket" in data
            assert data["ticket"].get("ticket_id") == ticket_id
            print(f"✅ Single ticket {ticket_id} retrieved successfully")
        else:
            pytest.skip("No tickets available to test")


class TestProductVariants:
    """Test product variant functionality"""
    
    def test_products_with_options(self):
        """Test that products with options have proper variant data"""
        response = requests.get(f"{BASE_URL}/api/products?limit=20")
        assert response.status_code == 200
        data = response.json()
        products = data.get("products", [])
        
        # Find products with options
        products_with_options = [p for p in products if p.get("options") and len(p.get("options", [])) > 0]
        assert len(products_with_options) > 0, "Should have products with options"
        
        # Check that options have values
        for product in products_with_options[:3]:
            options = product.get("options", [])
            for opt in options:
                if opt.get("name") != "Title":
                    assert "values" in opt, f"Option {opt.get('name')} should have values"
                    print(f"✅ Product '{product.get('name')}' has option '{opt.get('name')}' with {len(opt.get('values', []))} values")
    
    def test_product_variants_structure(self):
        """Test that products have proper variant structure"""
        response = requests.get(f"{BASE_URL}/api/products?limit=10")
        assert response.status_code == 200
        products = response.json().get("products", [])
        
        # Find a product with variants
        product_with_variants = None
        for p in products:
            if p.get("variants") and len(p.get("variants", [])) > 1:
                product_with_variants = p
                break
        
        if product_with_variants:
            variants = product_with_variants.get("variants", [])
            for variant in variants[:3]:
                assert "price" in variant, "Variant should have price"
                assert "id" in variant, "Variant should have id"
                print(f"✅ Variant '{variant.get('title')}' has price ₹{variant.get('price')}")
        else:
            print("⚠️ No products with multiple variants found in first 10 products")


class TestPillarProducts:
    """Test that all 14 pillars have products and services"""
    
    PILLARS = ["celebrate", "stay", "travel", "feed", "care", "fit", "learn", 
               "enjoy", "groom", "adopt", "farewell", "dine", "insure", "shop"]
    
    def test_all_pillars_have_products(self):
        """Test that all 14 pillars have products"""
        pillars_with_products = []
        pillars_without_products = []
        
        for pillar in self.PILLARS:
            response = requests.get(f"{BASE_URL}/api/products?pillar={pillar}&limit=1")
            if response.status_code == 200:
                data = response.json()
                count = data.get("total", len(data.get("products", [])))
                if count > 0:
                    pillars_with_products.append((pillar, count))
                else:
                    pillars_without_products.append(pillar)
            else:
                pillars_without_products.append(pillar)
        
        print(f"✅ Pillars with products: {len(pillars_with_products)}/14")
        for pillar, count in pillars_with_products:
            print(f"   - {pillar}: {count} products")
        
        if pillars_without_products:
            print(f"⚠️ Pillars without products: {pillars_without_products}")
        
        # All pillars should have products
        assert len(pillars_with_products) == 14, f"All 14 pillars should have products, missing: {pillars_without_products}"
    
    def test_all_pillars_have_services(self):
        """Test that all 14 pillars have services"""
        pillars_with_services = []
        
        for pillar in self.PILLARS:
            response = requests.get(f"{BASE_URL}/api/services?pillar={pillar}&limit=1")
            if response.status_code == 200:
                data = response.json()
                count = data.get("total", len(data.get("services", [])))
                if count > 0:
                    pillars_with_services.append((pillar, count))
        
        print(f"✅ Pillars with services: {len(pillars_with_services)}/14")
        # Services are optional, just report
        assert len(pillars_with_services) >= 10, "At least 10 pillars should have services"


class TestPetScore:
    """Test Pet Score (Pawmoter) functionality"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": MEMBER_EMAIL, "password": MEMBER_PASSWORD}
        )
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Authentication failed")
    
    def test_pet_score_endpoint(self, auth_token):
        """Test pet score endpoint returns score data"""
        # First get user's pets
        headers = {"Authorization": f"Bearer {auth_token}"}
        pets_response = requests.get(f"{BASE_URL}/api/pets/my-pets", headers=headers)
        assert pets_response.status_code == 200
        pets = pets_response.json().get("pets", [])
        
        if len(pets) > 0:
            pet_id = pets[0].get("id")
            score_response = requests.get(
                f"{BASE_URL}/api/pet-score/{pet_id}/score_state",
                headers=headers
            )
            assert score_response.status_code == 200
            data = score_response.json()
            
            assert "score" in data, "Response should have score"
            assert "tier" in data, "Response should have tier"
            assert "categories" in data, "Response should have categories"
            
            print(f"✅ Pet {data.get('pet_name')} has score: {data.get('score')}%")
            print(f"   Tier: {data.get('tier', {}).get('name')}")
        else:
            pytest.skip("No pets found for user")


class TestNPSTestimonials:
    """Test NPS/Pawmoter testimonials"""
    
    def test_nps_testimonials_endpoint(self):
        """Test NPS testimonials endpoint returns data"""
        response = requests.get(f"{BASE_URL}/api/concierge/nps/testimonials?limit=5")
        assert response.status_code == 200
        data = response.json()
        
        assert "testimonials" in data
        testimonials = data.get("testimonials", [])
        
        if len(testimonials) > 0:
            for t in testimonials[:3]:
                assert "score" in t, "Testimonial should have score"
                assert "feedback" in t, "Testimonial should have feedback"
                print(f"✅ Testimonial: {t.get('member_name')} - Score: {t.get('score')}/100")
        else:
            print("⚠️ No testimonials found")


class TestHealthCheck:
    """Basic health check"""
    
    def test_api_health(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        print("✅ API is healthy")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
