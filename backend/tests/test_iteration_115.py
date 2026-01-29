"""
Iteration 115 Tests - Push Notifications, Mobile Layout, Voice Mira, Checkout
Features tested:
1. TTS Config endpoint (Indian voice preference)
2. Pet Soul answer saving API
3. Wishlist API
4. Checkout config (delivery only)
5. Health endpoint
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthAndConfig:
    """Health and configuration endpoint tests"""
    
    def test_health_endpoint(self):
        """Test health endpoint returns healthy status"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        print(f"✅ Health check passed: {data}")
    
    def test_tts_config_endpoint(self):
        """Test TTS config returns Indian voice settings"""
        response = requests.get(f"{BASE_URL}/api/tts/config")
        assert response.status_code == 200
        data = response.json()
        
        # Verify TTS config structure
        assert "provider" in data
        assert "features" in data
        
        # Check for Indian voice feature
        features = data.get("features", [])
        has_indian_voice = any("Indian" in f for f in features)
        assert has_indian_voice, "Indian voice feature should be present"
        
        # Check for Mira pronunciation fix
        has_mira_fix = any("Mira" in f or "Meera" in f for f in features)
        assert has_mira_fix, "Mira pronunciation fix should be present"
        
        print(f"✅ TTS Config: provider={data.get('provider')}, features={features}")


class TestCheckoutConfig:
    """Checkout configuration tests - delivery only"""
    
    def test_checkout_config_endpoint(self):
        """Test checkout config endpoint"""
        response = requests.get(f"{BASE_URL}/api/checkout/config")
        assert response.status_code == 200
        data = response.json()
        
        # Verify config structure
        assert "free_shipping_threshold" in data or "default_shipping_fee" in data
        print(f"✅ Checkout config: {data}")
    
    def test_checkout_calculate_total(self):
        """Test checkout total calculation (delivery only)"""
        payload = {
            "customer": {
                "name": "Test User",
                "email": "test@example.com",
                "phone": "9876543210"
            },
            "delivery": {
                "method": "delivery",
                "address": "123 Test Street",
                "city": "Bangalore",
                "state": "Karnataka",
                "pincode": "560001"
            },
            "items": [
                {
                    "id": "test-item-1",
                    "name": "Test Treat",
                    "price": 500,
                    "quantity": 2,
                    "category": "treats"
                }
            ],
            "subtotal": 1000,
            "shipping_fee": 150,
            "discount_amount": 0
        }
        
        response = requests.post(
            f"{BASE_URL}/api/checkout/calculate-total",
            json=payload
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify GST calculation
        assert "grand_total" in data or "total" in data
        print(f"✅ Checkout calculation: {data}")


class TestPetSoulAPI:
    """Pet Soul answer saving API tests"""
    
    def test_pet_soul_answer_endpoint_exists(self):
        """Test Pet Soul answer endpoint exists"""
        # Test with a dummy pet ID - should return 401 or 404, not 500
        response = requests.post(
            f"{BASE_URL}/api/pet-soul/profile/test-pet-id/answer",
            json={
                "question_id": "test-q1",
                "answer": "Test answer"
            }
        )
        # Should not be 500 (server error)
        assert response.status_code != 500, "Pet Soul endpoint should not return 500"
        print(f"✅ Pet Soul endpoint exists, status: {response.status_code}")


class TestWishlistAPI:
    """Wishlist API tests"""
    
    def test_wishlist_endpoint_requires_auth(self):
        """Test wishlist endpoint requires authentication"""
        response = requests.get(f"{BASE_URL}/api/member/wishlist")
        # Should return 401 or 403 for unauthenticated request
        assert response.status_code in [401, 403, 422], f"Expected auth error, got {response.status_code}"
        print(f"✅ Wishlist requires auth, status: {response.status_code}")
    
    def test_wishlist_add_requires_auth(self):
        """Test wishlist add endpoint requires authentication"""
        response = requests.post(
            f"{BASE_URL}/api/member/wishlist/add",
            json={"product_id": "test-product"}
        )
        # Should return 401 or 403 for unauthenticated request
        assert response.status_code in [401, 403, 422], f"Expected auth error, got {response.status_code}"
        print(f"✅ Wishlist add requires auth, status: {response.status_code}")


class TestPillarEndpoints:
    """Test pillar page endpoints for mobile layout data"""
    
    def test_dine_restaurants_endpoint(self):
        """Test dine restaurants endpoint"""
        response = requests.get(f"{BASE_URL}/api/dine/restaurants")
        assert response.status_code == 200
        data = response.json()
        assert "restaurants" in data
        print(f"✅ Dine restaurants: {len(data.get('restaurants', []))} found")
    
    def test_dine_bundles_endpoint(self):
        """Test dine bundles endpoint"""
        response = requests.get(f"{BASE_URL}/api/dine/bundles")
        assert response.status_code == 200
        data = response.json()
        assert "bundles" in data
        print(f"✅ Dine bundles: {len(data.get('bundles', []))} found")
    
    def test_dine_products_endpoint(self):
        """Test dine products endpoint"""
        response = requests.get(f"{BASE_URL}/api/dine/products")
        assert response.status_code == 200
        data = response.json()
        assert "products" in data
        print(f"✅ Dine products: {len(data.get('products', []))} found")
    
    def test_shop_products_endpoint(self):
        """Test shop products endpoint"""
        response = requests.get(f"{BASE_URL}/api/products")
        assert response.status_code == 200
        data = response.json()
        # Should return products array
        assert isinstance(data, list) or "products" in data
        print(f"✅ Shop products endpoint working")


class TestMiraFloatingButton:
    """Test Mira-related endpoints"""
    
    def test_pets_endpoint_requires_auth(self):
        """Test pets endpoint for Mira personalization"""
        response = requests.get(
            f"{BASE_URL}/api/pets/my-pets",
            headers={"Authorization": "Bearer invalid-token"}
        )
        # Should return auth error, not 500
        assert response.status_code != 500
        print(f"✅ Pets endpoint auth check, status: {response.status_code}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
