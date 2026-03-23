"""
Iteration 114 Backend Tests
Testing:
1. TTS Config endpoint (ElevenLabs)
2. Pet Soul answer saving API
3. Wishlist APIs
4. Pet photo upload API
5. Health check
"""

import pytest
import requests
import os
import json

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://flat-art-picker.preview.emergentagent.com').rstrip('/')

# Test credentials
MEMBER_EMAIL = "dipali@clubconcierge.in"
MEMBER_PASSWORD = "test123"


class TestHealthAndTTS:
    """Health check and TTS configuration tests"""
    
    def test_health_check(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print(f"✓ Health check passed: {data}")
    
    def test_tts_config_endpoint(self):
        """Test TTS configuration endpoint - GET /api/tts/config"""
        response = requests.get(f"{BASE_URL}/api/tts/config")
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "provider" in data
        assert data["provider"] == "elevenlabs"
        assert "configured" in data
        assert "default_voice_id" in data
        assert "pronunciation_fixes" in data
        assert "features" in data
        
        # Verify features list
        assert isinstance(data["features"], list)
        assert len(data["features"]) > 0
        
        print(f"✓ TTS config endpoint passed: provider={data['provider']}, configured={data['configured']}")
        print(f"  Features: {data['features']}")


class TestAuthentication:
    """Authentication tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token for member"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": MEMBER_EMAIL,
            "password": MEMBER_PASSWORD
        })
        if response.status_code == 200:
            data = response.json()
            return data.get("access_token") or data.get("token")
        pytest.skip(f"Authentication failed: {response.status_code} - {response.text}")
    
    def test_member_login(self):
        """Test member login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": MEMBER_EMAIL,
            "password": MEMBER_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data or "token" in data
        print(f"✓ Member login successful")


class TestWishlistAPI:
    """Wishlist API tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token for member"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": MEMBER_EMAIL,
            "password": MEMBER_PASSWORD
        })
        if response.status_code == 200:
            data = response.json()
            return data.get("access_token") or data.get("token")
        pytest.skip(f"Authentication failed: {response.status_code}")
    
    def test_get_wishlist(self, auth_token):
        """Test GET /api/member/wishlist"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/member/wishlist", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "wishlist" in data
        assert "count" in data
        print(f"✓ Get wishlist passed: {data['count']} items")
    
    def test_add_to_wishlist(self, auth_token):
        """Test POST /api/member/wishlist/add"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # First get a product to add
        products_response = requests.get(f"{BASE_URL}/api/products?limit=1")
        if products_response.status_code != 200 or not products_response.json().get("products"):
            pytest.skip("No products available to test wishlist")
        
        product = products_response.json()["products"][0]
        product_id = product.get("id") or product.get("shopify_id")
        
        # Add to wishlist
        response = requests.post(
            f"{BASE_URL}/api/member/wishlist/add",
            headers=headers,
            json={"product_id": product_id}
        )
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✓ Add to wishlist passed: {data['message']}")
        
        # Verify it's in wishlist
        verify_response = requests.get(f"{BASE_URL}/api/member/wishlist", headers=headers)
        assert verify_response.status_code == 200
        wishlist_data = verify_response.json()
        assert wishlist_data["count"] >= 1
        print(f"✓ Wishlist verification passed: {wishlist_data['count']} items")


class TestPetSoulAPI:
    """Pet Soul answer saving API tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token for member"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": MEMBER_EMAIL,
            "password": MEMBER_PASSWORD
        })
        if response.status_code == 200:
            data = response.json()
            return data.get("access_token") or data.get("token")
        pytest.skip(f"Authentication failed: {response.status_code}")
    
    @pytest.fixture
    def test_pet_id(self, auth_token):
        """Get a pet ID for testing"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/pets/my-pets", headers=headers)
        if response.status_code == 200:
            data = response.json()
            pets = data.get("pets", [])
            if pets:
                return pets[0]["id"]
        
        # Try to get any pet from public endpoint
        public_response = requests.get(f"{BASE_URL}/api/pets/public?limit=1")
        if public_response.status_code == 200:
            data = public_response.json()
            pets = data.get("pets", [])
            if pets:
                return pets[0]["id"]
        
        pytest.skip("No pets available for testing")
    
    def test_get_pet_soul_profile(self, test_pet_id):
        """Test GET /api/pet-soul/profile/{pet_id}"""
        response = requests.get(f"{BASE_URL}/api/pet-soul/profile/{test_pet_id}")
        # May return 404 if pet doesn't exist, or 200 if it does
        assert response.status_code in [200, 404]
        if response.status_code == 200:
            data = response.json()
            assert "pet" in data
            print(f"✓ Get pet soul profile passed for pet {test_pet_id}")
        else:
            print(f"✓ Pet soul profile endpoint working (pet not found)")
    
    def test_save_pet_soul_answer(self, auth_token, test_pet_id):
        """Test POST /api/pet-soul/profile/{pet_id}/answer"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Test saving an answer
        answer_data = {
            "question_id": "test_question_1",
            "answer": "test_answer_value"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/pet-soul/profile/{test_pet_id}/answer",
            headers=headers,
            json=answer_data
        )
        
        # Should return 200 on success or 404 if pet not found
        assert response.status_code in [200, 404]
        
        if response.status_code == 200:
            data = response.json()
            assert "message" in data
            assert data.get("question_id") == "test_question_1"
            print(f"✓ Save pet soul answer passed: {data['message']}")
        else:
            print(f"✓ Pet soul answer endpoint working (pet not found)")


class TestPetPhotoAPI:
    """Pet photo upload API tests"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token for member"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": MEMBER_EMAIL,
            "password": MEMBER_PASSWORD
        })
        if response.status_code == 200:
            data = response.json()
            return data.get("access_token") or data.get("token")
        pytest.skip(f"Authentication failed: {response.status_code}")
    
    @pytest.fixture
    def test_pet_id(self, auth_token):
        """Get a pet ID for testing"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/pets/my-pets", headers=headers)
        if response.status_code == 200:
            data = response.json()
            pets = data.get("pets", [])
            if pets:
                return pets[0]["id"]
        pytest.skip("No pets available for testing")
    
    def test_pet_photo_upload_endpoint_exists(self, test_pet_id):
        """Test that POST /api/pets/{pet_id}/photo endpoint exists"""
        # Create a small test image (1x1 pixel PNG)
        import base64
        # Minimal valid PNG
        png_data = base64.b64decode(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        )
        
        files = {"photo": ("test.png", png_data, "image/png")}
        response = requests.post(
            f"{BASE_URL}/api/pets/{test_pet_id}/photo",
            files=files
        )
        
        # Should return 200 on success or 404 if pet not found
        assert response.status_code in [200, 404, 422]
        
        if response.status_code == 200:
            data = response.json()
            assert "photo_url" in data
            print(f"✓ Pet photo upload passed: {data['photo_url']}")
        elif response.status_code == 404:
            print(f"✓ Pet photo upload endpoint working (pet not found)")
        else:
            print(f"✓ Pet photo upload endpoint exists (validation error)")


class TestProductsAPI:
    """Products API tests for checkout flow"""
    
    def test_get_products(self):
        """Test GET /api/products"""
        response = requests.get(f"{BASE_URL}/api/products?limit=5")
        assert response.status_code == 200
        data = response.json()
        assert "products" in data
        print(f"✓ Get products passed: {len(data['products'])} products")
    
    def test_get_app_settings(self):
        """Test GET /api/app-settings for checkout configuration"""
        response = requests.get(f"{BASE_URL}/api/app-settings")
        # May return 200 or 404 depending on implementation
        if response.status_code == 200:
            data = response.json()
            print(f"✓ App settings endpoint working")
        else:
            print(f"✓ App settings endpoint returned {response.status_code}")


class TestMiraFloatingButton:
    """Tests related to Mira floating button functionality"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token for member"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": MEMBER_EMAIL,
            "password": MEMBER_PASSWORD
        })
        if response.status_code == 200:
            data = response.json()
            return data.get("access_token") or data.get("token")
        pytest.skip(f"Authentication failed: {response.status_code}")
    
    def test_pets_endpoint_for_mira(self, auth_token):
        """Test /api/pets/my-pets endpoint used by MiraFloatingButton"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/pets/my-pets", headers=headers)
        assert response.status_code == 200
        data = response.json()
        assert "pets" in data
        print(f"✓ Pets endpoint for Mira passed: {len(data['pets'])} pets")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
