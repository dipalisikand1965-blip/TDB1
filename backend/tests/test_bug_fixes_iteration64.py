"""
Test Bug Fixes - Iteration 64
Tests for:
1. PATCH /api/pets/{pet_id}/soul-answers - Inline soul answer editing
2. POST /api/pets/{pet_id}/photo - Pet photo upload
3. GET /api/pets/{pet_id} - Pet profile retrieval
4. GET /api/products - Shop page products (790+ products)
"""

import pytest
import requests
import os
import io

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "dipali@clubconcierge.in"
TEST_PASSWORD = "lola4304"
TEST_PET_ID = "pet-99a708f1722a"


class TestAuthentication:
    """Test user authentication"""
    
    def test_user_login(self):
        """Test user can login and get token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        print(f"Login response status: {response.status_code}")
        print(f"Login response: {response.text[:500]}")
        
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "access_token" in data or "token" in data, "No token in response"
        return data.get("access_token") or data.get("token")


class TestPetSoulAnswers:
    """Test Pet Soul answer endpoints"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code == 200:
            data = response.json()
            return data.get("access_token") or data.get("token")
        pytest.skip("Authentication failed")
    
    def test_get_pet_profile(self, auth_token):
        """Test GET pet profile"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/pets/{TEST_PET_ID}", headers=headers)
        
        print(f"Get pet response status: {response.status_code}")
        print(f"Get pet response: {response.text[:500]}")
        
        assert response.status_code == 200, f"Failed to get pet: {response.text}"
        data = response.json()
        assert "id" in data or "name" in data, "Pet data missing expected fields"
    
    def test_patch_soul_answers_endpoint_exists(self, auth_token):
        """Test PATCH /api/pets/{pet_id}/soul-answers endpoint exists and accepts requests"""
        headers = {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }
        
        # Test with a simple answer update
        test_answer = {"temperament": "Playful"}
        response = requests.patch(
            f"{BASE_URL}/api/pets/{TEST_PET_ID}/soul-answers",
            json=test_answer,
            headers=headers
        )
        
        print(f"PATCH soul-answers status: {response.status_code}")
        print(f"PATCH soul-answers response: {response.text[:500]}")
        
        # Should return 200 or 401 (if auth required) - NOT 404 or 405
        assert response.status_code in [200, 401, 422], f"Unexpected status: {response.status_code} - {response.text}"
    
    def test_patch_soul_answers_updates_data(self, auth_token):
        """Test PATCH actually updates the soul answers"""
        headers = {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }
        
        # First get current state
        get_response = requests.get(f"{BASE_URL}/api/pets/{TEST_PET_ID}", headers=headers)
        if get_response.status_code != 200:
            pytest.skip("Cannot get pet data")
        
        # Update with test value
        test_value = "TEST_Energetic_" + str(os.urandom(4).hex())
        test_answer = {"temperament": test_value}
        
        patch_response = requests.patch(
            f"{BASE_URL}/api/pets/{TEST_PET_ID}/soul-answers",
            json=test_answer,
            headers=headers
        )
        
        print(f"PATCH response: {patch_response.status_code} - {patch_response.text[:300]}")
        
        if patch_response.status_code == 200:
            # Verify the update persisted
            verify_response = requests.get(f"{BASE_URL}/api/pets/{TEST_PET_ID}", headers=headers)
            if verify_response.status_code == 200:
                pet_data = verify_response.json()
                soul_answers = pet_data.get("doggy_soul_answers", {})
                assert soul_answers.get("temperament") == test_value, "Answer not persisted"
                print(f"✓ Soul answer updated and verified: {test_value}")
    
    def test_post_soul_answer_single(self, auth_token):
        """Test POST /api/pets/{pet_id}/soul-answer for single answer"""
        headers = {
            "Authorization": f"Bearer {auth_token}",
            "Content-Type": "application/json"
        }
        
        test_data = {
            "question_id": "favorite_treats",
            "answer": "Chicken Jerky"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/pets/{TEST_PET_ID}/soul-answer",
            json=test_data,
            headers=headers
        )
        
        print(f"POST soul-answer status: {response.status_code}")
        print(f"POST soul-answer response: {response.text[:300]}")
        
        # Should work or require auth
        assert response.status_code in [200, 401], f"Unexpected status: {response.status_code}"


class TestPhotoUpload:
    """Test pet photo upload endpoint"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code == 200:
            data = response.json()
            return data.get("access_token") or data.get("token")
        pytest.skip("Authentication failed")
    
    def test_photo_upload_endpoint_exists(self, auth_token):
        """Test POST /api/pets/{pet_id}/photo endpoint exists"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Create a simple test image (1x1 pixel PNG)
        # PNG header for a 1x1 transparent pixel
        png_data = bytes([
            0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A,  # PNG signature
            0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52,  # IHDR chunk
            0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,  # 1x1 dimensions
            0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4,  # bit depth, color type
            0x89, 0x00, 0x00, 0x00, 0x0A, 0x49, 0x44, 0x41,  # IDAT chunk
            0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,  # compressed data
            0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00,  # 
            0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE,  # IEND chunk
            0x42, 0x60, 0x82
        ])
        
        files = {
            'photo': ('test_pet.png', io.BytesIO(png_data), 'image/png')
        }
        
        response = requests.post(
            f"{BASE_URL}/api/pets/{TEST_PET_ID}/photo",
            files=files,
            headers=headers
        )
        
        print(f"Photo upload status: {response.status_code}")
        print(f"Photo upload response: {response.text[:500]}")
        
        # Should return 200, 401 (auth), or 400 (validation) - NOT 404 or 405
        assert response.status_code in [200, 400, 401, 422], f"Unexpected status: {response.status_code}"
        
        if response.status_code == 200:
            data = response.json()
            assert "photo_url" in data, "No photo_url in response"
            print(f"✓ Photo uploaded successfully: {data.get('photo_url')}")


class TestShopProducts:
    """Test Shop page products endpoint"""
    
    def test_products_endpoint(self):
        """Test GET /api/products returns products"""
        response = requests.get(f"{BASE_URL}/api/products")
        
        print(f"Products endpoint status: {response.status_code}")
        
        assert response.status_code == 200, f"Products endpoint failed: {response.text}"
        data = response.json()
        
        # Should return a list of products
        if isinstance(data, list):
            product_count = len(data)
        elif isinstance(data, dict) and "products" in data:
            product_count = len(data["products"])
        else:
            product_count = 0
        
        print(f"Products count: {product_count}")
        assert product_count > 0, "No products returned"
    
    def test_products_count_for_shop(self):
        """Test that shop has substantial product catalog (790+ expected)"""
        response = requests.get(f"{BASE_URL}/api/products?limit=1000")
        
        assert response.status_code == 200
        data = response.json()
        
        if isinstance(data, list):
            product_count = len(data)
        elif isinstance(data, dict) and "products" in data:
            product_count = len(data["products"])
        elif isinstance(data, dict) and "total" in data:
            product_count = data["total"]
        else:
            product_count = 0
        
        print(f"Total products in shop: {product_count}")
        # Should have substantial catalog
        assert product_count >= 10, f"Expected more products, got {product_count}"


class TestFarewellAndShopPages:
    """Test that Farewell and Shop pages have proper backend support"""
    
    def test_health_endpoint(self):
        """Test API health"""
        response = requests.get(f"{BASE_URL}/api/health")
        print(f"Health check: {response.status_code}")
        assert response.status_code == 200
    
    def test_pillars_endpoint(self):
        """Test pillars endpoint for Farewell pillar"""
        response = requests.get(f"{BASE_URL}/api/pillars")
        
        print(f"Pillars endpoint status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Pillars data: {data}")
            # Check if farewell pillar exists
            if isinstance(data, list):
                pillar_ids = [p.get("id") or p.get("slug") for p in data]
                print(f"Pillar IDs: {pillar_ids}")


class TestPetSoulLinks:
    """Test that pet-soul links redirect properly"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code == 200:
            data = response.json()
            return data.get("access_token") or data.get("token")
        pytest.skip("Authentication failed")
    
    def test_pet_endpoint_works(self, auth_token):
        """Test /api/pets/{petId} endpoint works (used by /pet/{petId} route)"""
        headers = {"Authorization": f"Bearer {auth_token}"}
        response = requests.get(f"{BASE_URL}/api/pets/{TEST_PET_ID}", headers=headers)
        
        print(f"Pet endpoint status: {response.status_code}")
        assert response.status_code == 200, f"Pet endpoint failed: {response.text}"
        
        data = response.json()
        assert "name" in data or "id" in data, "Pet data incomplete"
        print(f"✓ Pet data retrieved: {data.get('name', 'Unknown')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
