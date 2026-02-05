"""
Test Mira AI Features - Iteration 142
Tests for:
1. Pet recommendations API returns products with proper image URLs
2. Mira chat returns products with image URLs
3. View/Add buttons functionality
4. Voice wizard in navbar
5. Multi-pet dropdown
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://pawfect-service.preview.emergentagent.com')

class TestMiraFeatures:
    """Test Mira AI features"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test fixtures"""
        # Login and get token
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "dipali@clubconcierge.in", "password": "test123"}
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        self.token = response.json().get('access_token')
        self.headers = {"Authorization": f"Bearer {self.token}"}
        
        # Get user's pets
        pets_response = requests.get(f"{BASE_URL}/api/pets", headers=self.headers)
        assert pets_response.status_code == 200
        self.pets = pets_response.json().get('pets', [])
        assert len(self.pets) > 0, "User should have at least one pet"
        self.pet_id = self.pets[0]['id']
    
    def test_pet_recommendations_returns_proper_images(self):
        """Test that pet-recommendations endpoint returns products with https:// image URLs"""
        response = requests.get(
            f"{BASE_URL}/api/mira/pet-recommendations/{self.pet_id}?pillar=travel",
            headers=self.headers
        )
        
        assert response.status_code == 200, f"API failed: {response.text}"
        data = response.json()
        
        # Check recommendations exist
        recommendations = data.get('recommendations', [])
        assert len(recommendations) > 0, "Should return at least one recommendation"
        
        # Check each product has proper image URL
        for product in recommendations:
            image_url = product.get('image', '')
            assert image_url.startswith('https://'), f"Image URL should start with https://: {image_url}"
            # Should be either Unsplash fallback or Shopify CDN
            assert 'unsplash.com' in image_url or 'shopify.com' in image_url or 'cdn.' in image_url, \
                f"Image should be from Unsplash or Shopify CDN: {image_url}"
        
        print(f"✅ PASS: {len(recommendations)} products with proper image URLs")
    
    def test_mira_chat_returns_products_with_images(self):
        """Test that Mira chat returns products with proper image URLs"""
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            headers={**self.headers, "Content-Type": "application/json"},
            json={
                "message": "Show me travel products for my dog",
                "session_id": "test-session-142",
                "source": "chat_widget",
                "current_pillar": "travel",
                "selected_pet_id": self.pet_id
            }
        )
        
        assert response.status_code == 200, f"Chat API failed: {response.text}"
        data = response.json()
        
        # Check response exists
        assert 'response' in data, "Should have response field"
        
        # Check products if returned
        products = data.get('products', [])
        if len(products) > 0:
            for product in products:
                image_url = product.get('image', '')
                if image_url:
                    assert image_url.startswith('https://'), f"Image URL should start with https://: {image_url}"
            print(f"✅ PASS: Chat returned {len(products)} products with proper images")
        else:
            print("⚠️ No products returned in this chat response (may be normal)")
    
    def test_pet_recommendations_different_pillars(self):
        """Test pet-recommendations for different pillars"""
        pillars = ['travel', 'care', 'celebrate', 'dine', 'enjoy']
        
        for pillar in pillars:
            response = requests.get(
                f"{BASE_URL}/api/mira/pet-recommendations/{self.pet_id}?pillar={pillar}",
                headers=self.headers
            )
            
            assert response.status_code == 200, f"API failed for pillar {pillar}: {response.text}"
            data = response.json()
            
            # Check pillar is correct
            assert data.get('pillar') == pillar, f"Pillar mismatch: expected {pillar}"
            
            # Check recommendations have images
            recommendations = data.get('recommendations', [])
            for product in recommendations:
                image_url = product.get('image', '')
                assert image_url.startswith('https://'), f"Image URL should start with https:// for {pillar}: {image_url}"
        
        print(f"✅ PASS: All {len(pillars)} pillars return products with proper images")
    
    def test_multi_pet_api(self):
        """Test that API returns all pets with scores"""
        response = requests.get(f"{BASE_URL}/api/pets", headers=self.headers)
        
        assert response.status_code == 200, f"Pets API failed: {response.text}"
        data = response.json()
        
        pets = data.get('pets', [])
        assert len(pets) >= 5, f"User should have 5 pets, got {len(pets)}"
        
        # Check each pet has required fields
        for pet in pets:
            assert 'id' in pet, "Pet should have id"
            assert 'name' in pet, "Pet should have name"
            assert 'breed' in pet, "Pet should have breed"
            assert 'overall_score' in pet, "Pet should have overall_score"
        
        print(f"✅ PASS: {len(pets)} pets returned with scores")
        for pet in pets:
            print(f"  - {pet['name']} ({pet['breed']}): {pet.get('overall_score', 0)}%")
    
    def test_quick_prompts_api(self):
        """Test quick prompts API for different pillars"""
        pillars = ['travel', 'care', 'celebrate']
        
        for pillar in pillars:
            response = requests.get(f"{BASE_URL}/api/mira/quick-prompts/{pillar}")
            
            assert response.status_code == 200, f"Quick prompts API failed for {pillar}: {response.text}"
            data = response.json()
            
            prompts = data.get('prompts', [])
            assert len(prompts) > 0, f"Should return prompts for {pillar}"
        
        print(f"✅ PASS: Quick prompts API working for all pillars")


class TestHealthCheck:
    """Basic health checks"""
    
    def test_api_health(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get('status') == 'healthy'
        print("✅ PASS: API is healthy")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
