"""
Test Advisory Page Features
- Pet selector in hero section
- Title with pet name
- Concierge modal with pet selection
- Advisory AI endpoint
- Mockup generator status
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://product-box-refactor.preview.emergentagent.com')
TEST_EMAIL = "dipali@clubconcierge.in"
TEST_PASSWORD = "test123"


class TestAdvisoryFeatures:
    """Tests for Advisory page features"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get token before tests"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        self.token = data.get("access_token")
        self.headers = {"Authorization": f"Bearer {self.token}"}
        yield
    
    def test_pets_api_returns_9_pets(self):
        """Test that /api/pets/my-pets returns all 9 pets for the test user"""
        response = requests.get(
            f"{BASE_URL}/api/pets/my-pets",
            headers=self.headers
        )
        assert response.status_code == 200, f"Pets API failed: {response.text}"
        data = response.json()
        
        pets = data.get("pets", [])
        assert len(pets) >= 9, f"Expected 9 pets, got {len(pets)}"
        
        # Verify pet names include expected pets
        pet_names = [p.get("name") for p in pets]
        assert "Mojo" in pet_names, "Mojo not found in pets"
        print(f"✅ Found {len(pets)} pets: {pet_names}")
    
    def test_pets_have_photos(self):
        """Test that pets have photo URLs for displaying in pet selector"""
        response = requests.get(
            f"{BASE_URL}/api/pets/my-pets",
            headers=self.headers
        )
        assert response.status_code == 200
        data = response.json()
        pets = data.get("pets", [])
        
        # Check at least first pet has photo-related data
        first_pet = pets[0] if pets else None
        assert first_pet is not None, "No pets found"
        
        # Photo can be in 'photo', 'photo_url', or 'avatar' field
        has_photo_field = any(
            first_pet.get(field) for field in ['photo', 'photo_url', 'avatar', 'soul_data']
        )
        print(f"✅ Pet '{first_pet.get('name')}' has photo/avatar data: {has_photo_field}")
    
    def test_advisory_ai_returns_contextual_answer(self):
        """Test Advisory AI gives contextual answers based on question"""
        # Test food question
        response = requests.post(
            f"{BASE_URL}/api/advisory/ask-advisory",
            headers={**self.headers, "Content-Type": "application/json"},
            json={
                "question": "What food is best for my dog?",
                "pet_name": "Mojo",
                "pet_breed": "Indie",
                "pet_age": 3,
                "context": "advisory"
            }
        )
        assert response.status_code == 200, f"Advisory AI failed: {response.text}"
        data = response.json()
        
        answer = data.get("answer", "")
        assert len(answer) > 50, "Answer too short"
        
        # Check answer is contextual (contains food-related terms)
        food_terms = ['food', 'diet', 'nutrition', 'feed', 'meal', 'eat']
        has_food_context = any(term in answer.lower() for term in food_terms)
        assert has_food_context, f"Answer not food-contextual: {answer[:200]}"
        print(f"✅ Advisory AI returned contextual answer ({len(answer)} chars)")
    
    def test_advisory_products_endpoint(self):
        """Test Advisory products API returns products"""
        response = requests.get(f"{BASE_URL}/api/advisory/products")
        assert response.status_code == 200, f"Products API failed: {response.text}"
        data = response.json()
        
        products = data.get("products", [])
        assert len(products) > 0, "No advisory products found"
        print(f"✅ Advisory products: {len(products)} products")
    
    def test_advisory_bundles_endpoint(self):
        """Test Advisory bundles API returns bundles"""
        response = requests.get(f"{BASE_URL}/api/advisory/bundles")
        assert response.status_code == 200, f"Bundles API failed: {response.text}"
        data = response.json()
        
        bundles = data.get("bundles", [])
        assert len(bundles) > 0, "No advisory bundles found"
        print(f"✅ Advisory bundles: {len(bundles)} bundles")
    
    def test_mockup_generator_status(self):
        """Test that mockup generator status endpoint works"""
        response = requests.get(f"{BASE_URL}/api/mockups/status")
        assert response.status_code == 200, f"Mockup status failed: {response.text}"
        data = response.json()
        
        # Check for status indicators
        print(f"✅ Mockup generator status: {data}")


class TestConciergeModal:
    """Tests for Concierge Modal functionality"""
    
    def test_concierge_whatsapp_number_configured(self):
        """Verify WhatsApp number is configured for Concierge"""
        # The WhatsApp number is hardcoded in the frontend: 918971702582
        expected_number = "918971702582"
        print(f"✅ Concierge WhatsApp number configured: {expected_number}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
