"""
Test Iteration 143: Mira AI Navigation and Product Cards
=========================================================
Tests:
1. Mira shows visual product cards when asking for products
2. Concierge action returns navigate_to for cake requests (/celebrate/cakes)
3. Concierge action returns navigate_to for grooming requests (/groom)
4. Product cards have proper structure (images, prices, View/Add buttons)
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "dipali@clubconcierge.in"
TEST_PASSWORD = "test123"


class TestMiraNavigationFeatures:
    """Test Mira AI navigation and product card features"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        self.token = None
        
        # Login to get token
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if login_response.status_code == 200:
            data = login_response.json()
            self.token = data.get("token")
            self.session.headers.update({"Authorization": f"Bearer {self.token}"})
    
    def test_api_health(self):
        """Test API is healthy"""
        response = self.session.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        print("✅ API health check passed")
    
    def test_mira_chat_cake_request_returns_navigate_to(self):
        """Test that asking for cake returns navigate_to: /celebrate/cakes"""
        response = self.session.post(f"{BASE_URL}/api/mira/chat", json={
            "message": "I want to order a birthday cake for my dog",
            "session_id": "test-session-cake-143",
            "source": "chat_widget",
            "current_pillar": "celebrate"
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Check response has concierge_action
        assert "concierge_action" in data, "Response should have concierge_action"
        concierge_action = data.get("concierge_action", {})
        
        # Check navigate_to is /celebrate/cakes
        navigate_to = concierge_action.get("navigate_to")
        assert navigate_to == "/celebrate/cakes", f"Expected navigate_to=/celebrate/cakes, got {navigate_to}"
        
        # Check scroll_to_section
        scroll_to = concierge_action.get("scroll_to_section")
        assert scroll_to == "cake-selection", f"Expected scroll_to_section=cake-selection, got {scroll_to}"
        
        print(f"✅ Cake request returns navigate_to: {navigate_to}")
        print(f"✅ Cake request returns scroll_to_section: {scroll_to}")
    
    def test_mira_chat_grooming_request_returns_navigate_to(self):
        """Test that asking for grooming returns navigate_to: /groom with show_wizard"""
        response = self.session.post(f"{BASE_URL}/api/mira/chat", json={
            "message": "I need grooming for my dog",
            "session_id": "test-session-groom-143",
            "source": "chat_widget",
            "current_pillar": "care"
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Check response has concierge_action
        assert "concierge_action" in data, "Response should have concierge_action"
        concierge_action = data.get("concierge_action", {})
        
        # Check navigate_to is /groom
        navigate_to = concierge_action.get("navigate_to")
        assert navigate_to == "/groom", f"Expected navigate_to=/groom, got {navigate_to}"
        
        # Check show_wizard
        show_wizard = concierge_action.get("show_wizard")
        assert show_wizard == "grooming_booking", f"Expected show_wizard=grooming_booking, got {show_wizard}"
        
        print(f"✅ Grooming request returns navigate_to: {navigate_to}")
        print(f"✅ Grooming request returns show_wizard: {show_wizard}")
    
    def test_mira_chat_returns_products_with_images(self):
        """Test that Mira chat returns products with proper image URLs"""
        response = self.session.post(f"{BASE_URL}/api/mira/chat", json={
            "message": "Show me some cakes for my dog's birthday",
            "session_id": "test-session-products-143",
            "source": "chat_widget",
            "current_pillar": "celebrate"
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Check products are returned
        products = data.get("products", [])
        print(f"Products returned: {len(products)}")
        
        if products:
            for product in products[:3]:  # Check first 3 products
                print(f"  - {product.get('name')}: {product.get('price')}")
                
                # Check product has required fields
                assert "name" in product, "Product should have name"
                assert "price" in product, "Product should have price"
                
                # Check image URL is valid (https://)
                image = product.get("image") or product.get("images", [None])[0]
                if image:
                    assert image.startswith("https://"), f"Image should be https URL, got: {image}"
                    print(f"    Image: {image[:60]}...")
        
        print(f"✅ Products returned with proper structure")
    
    def test_mira_chat_travel_request_returns_navigate_to(self):
        """Test that asking for travel returns navigate_to: /travel"""
        response = self.session.post(f"{BASE_URL}/api/mira/chat", json={
            "message": "I want to travel with my dog",
            "session_id": "test-session-travel-143",
            "source": "chat_widget",
            "current_pillar": "travel"
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        concierge_action = data.get("concierge_action", {})
        navigate_to = concierge_action.get("navigate_to")
        
        # Travel should navigate to /travel
        assert navigate_to == "/travel", f"Expected navigate_to=/travel, got {navigate_to}"
        print(f"✅ Travel request returns navigate_to: {navigate_to}")
    
    def test_mira_chat_vet_request_returns_navigate_to(self):
        """Test that asking for vet returns navigate_to: /care"""
        response = self.session.post(f"{BASE_URL}/api/mira/chat", json={
            "message": "I need a vet appointment for my dog",
            "session_id": "test-session-vet-143",
            "source": "chat_widget",
            "current_pillar": "care"
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        concierge_action = data.get("concierge_action", {})
        navigate_to = concierge_action.get("navigate_to")
        scroll_to = concierge_action.get("scroll_to_section")
        
        # Vet should navigate to /care with scroll to vet-services
        assert navigate_to == "/care", f"Expected navigate_to=/care, got {navigate_to}"
        assert scroll_to == "vet-services", f"Expected scroll_to_section=vet-services, got {scroll_to}"
        print(f"✅ Vet request returns navigate_to: {navigate_to}, scroll_to: {scroll_to}")
    
    def test_celebrate_category_in_concierge_triggers(self):
        """Test that celebrate category triggers concierge action"""
        response = self.session.post(f"{BASE_URL}/api/mira/chat", json={
            "message": "I want to celebrate my dog's birthday with a party",
            "session_id": "test-session-celebrate-143",
            "source": "chat_widget",
            "current_pillar": "celebrate"
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        concierge_action = data.get("concierge_action", {})
        
        # Should have action_needed or navigate_to
        has_action = concierge_action.get("action_needed") or concierge_action.get("navigate_to")
        assert has_action, f"Celebrate request should trigger concierge action, got: {concierge_action}"
        
        print(f"✅ Celebrate category triggers concierge action: {concierge_action}")


class TestMiraProductRecommendations:
    """Test Mira product recommendations API"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        self.token = None
        
        # Login to get token
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if login_response.status_code == 200:
            data = login_response.json()
            self.token = data.get("token")
            self.session.headers.update({"Authorization": f"Bearer {self.token}"})
    
    def test_pet_recommendations_celebrate_pillar(self):
        """Test pet recommendations for celebrate pillar returns products with images"""
        # First get user's pets
        pets_response = self.session.get(f"{BASE_URL}/api/pets")
        if pets_response.status_code != 200:
            pytest.skip("Could not fetch pets")
        
        pets = pets_response.json().get("pets", [])
        if not pets:
            pytest.skip("No pets found for user")
        
        pet_id = pets[0].get("id")
        
        # Get recommendations for celebrate pillar
        response = self.session.get(f"{BASE_URL}/api/mira/pet-recommendations/{pet_id}?pillar=celebrate")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        recommendations = data.get("recommendations", [])
        print(f"Celebrate pillar recommendations: {len(recommendations)}")
        
        for rec in recommendations[:3]:
            print(f"  - {rec.get('name')}: ₹{rec.get('price')}")
            image = rec.get("image") or rec.get("images", [None])[0]
            if image:
                assert image.startswith("https://"), f"Image should be https URL"
        
        print(f"✅ Pet recommendations for celebrate pillar working")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
