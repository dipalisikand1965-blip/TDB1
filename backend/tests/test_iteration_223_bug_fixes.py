"""
Test file for iteration 223 - Bug fixes verification
Tests:
1. Pet photo upload API endpoint
2. Login API
3. Pets retrieval API
"""
import pytest
import requests
import os
import base64

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestAuthAndPets:
    """Test authentication and pets APIs"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token for test user"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "testnew@emergent.com", "password": "test1234"}
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        return response.json()["access_token"]
    
    def test_login_success(self):
        """Test login with test credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "testnew@emergent.com", "password": "test1234"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user"]["email"] == "testnew@emergent.com"
        print("PASS: Login successful")
    
    def test_get_user_pets(self, auth_token):
        """Test retrieving user's pets"""
        response = requests.get(
            f"{BASE_URL}/api/pets",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "pets" in data
        print(f"PASS: Got {len(data['pets'])} pets")
        return data["pets"]
    
    def test_pet_photo_upload(self, auth_token):
        """Test pet photo upload endpoint"""
        # First get the pet
        pets_response = requests.get(
            f"{BASE_URL}/api/pets",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert pets_response.status_code == 200
        pets = pets_response.json().get("pets", [])
        
        if not pets:
            pytest.skip("No pets found for user")
        
        pet_id = pets[0]["id"]
        print(f"Testing photo upload for pet: {pet_id}")
        
        # Create a simple test image (1x1 red pixel PNG)
        # Minimal valid PNG
        png_data = base64.b64decode(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        )
        
        # Upload the photo
        response = requests.post(
            f"{BASE_URL}/api/pets/{pet_id}/photo",
            headers={"Authorization": f"Bearer {auth_token}"},
            files={"photo": ("test.png", png_data, "image/png")}
        )
        
        assert response.status_code == 200, f"Photo upload failed: {response.text}"
        data = response.json()
        assert "photo_url" in data
        assert "message" in data
        print(f"PASS: Photo uploaded successfully, URL: {data['photo_url']}")
    
    def test_pet_photo_retrieval(self, auth_token):
        """Test retrieving uploaded pet photo"""
        # Get the pet first
        pets_response = requests.get(
            f"{BASE_URL}/api/pets",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        pets = pets_response.json().get("pets", [])
        
        if not pets:
            pytest.skip("No pets found")
        
        pet_id = pets[0]["id"]
        
        # Get the photo
        response = requests.get(f"{BASE_URL}/api/pet-photo/{pet_id}")
        
        assert response.status_code == 200, f"Photo retrieval failed: {response.status_code}"
        assert response.headers.get("content-type", "").startswith("image/")
        print(f"PASS: Photo retrieved, content-type: {response.headers.get('content-type')}")
    
    def test_demo_user_login(self):
        """Test login with demo user"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "demo@doggy.com", "password": "demo1234"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        print("PASS: Demo user login successful")


class TestHealthCheck:
    """Basic health and endpoint tests"""
    
    def test_api_health(self):
        """Test API is responding"""
        response = requests.get(f"{BASE_URL}/api/")
        # Could be 200 or 404 depending on if root endpoint exists
        assert response.status_code in [200, 404]
        print(f"PASS: API responding with status {response.status_code}")
    
    def test_frontend_loads(self):
        """Test frontend is accessible"""
        response = requests.get(BASE_URL)
        assert response.status_code == 200
        assert "html" in response.text.lower()
        print("PASS: Frontend is accessible")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
