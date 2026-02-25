"""
Test Pet Gallery API Endpoints
Tests for: POST /api/pets/{pet_id}/gallery, GET /api/pets/{pet_id}/gallery, 
DELETE /api/pets/{pet_id}/gallery/{photo_id}, POST /api/pets/{pet_id}/gallery/{photo_id}/set-main
"""
import pytest
import requests
import os
import io
import base64

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "dipali@clubconcierge.in"
TEST_PASSWORD = "lola4304"
TEST_PET_ID = "pet-99a708f1722a"  # Mojo


class TestGalleryAPI:
    """Test Pet Gallery API endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session with authentication"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login to get token
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        
        if login_response.status_code == 200:
            data = login_response.json()
            self.token = data.get("token")
            self.session.headers.update({"Authorization": f"Bearer {self.token}"})
        else:
            pytest.skip(f"Authentication failed: {login_response.status_code}")
    
    def test_get_gallery_endpoint_exists(self):
        """Test GET /api/pets/{pet_id}/gallery endpoint exists and returns data"""
        response = requests.get(f"{BASE_URL}/api/pets/{TEST_PET_ID}/gallery")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "pet_id" in data, "Response should contain pet_id"
        assert "photos" in data, "Response should contain photos array"
        assert "total_photos" in data, "Response should contain total_photos count"
        assert data["pet_id"] == TEST_PET_ID, f"Expected pet_id {TEST_PET_ID}, got {data['pet_id']}"
        
        print(f"✓ Gallery endpoint working - {data['total_photos']} photos found")
    
    def test_get_gallery_for_nonexistent_pet(self):
        """Test GET /api/pets/{pet_id}/gallery returns 404 for non-existent pet"""
        response = requests.get(f"{BASE_URL}/api/pets/nonexistent-pet-id/gallery")
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Returns 404 for non-existent pet")
    
    def test_upload_gallery_photo(self):
        """Test POST /api/pets/{pet_id}/gallery - upload photo to gallery"""
        # Create a small test image (1x1 pixel PNG)
        test_image = base64.b64decode(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        )
        
        files = {
            'photo': ('test_image.png', io.BytesIO(test_image), 'image/png')
        }
        
        # Remove Content-Type header for multipart upload
        headers = {"Authorization": f"Bearer {self.token}"}
        
        response = requests.post(
            f"{BASE_URL}/api/pets/{TEST_PET_ID}/gallery",
            files=files,
            headers=headers
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "photo_id" in data, "Response should contain photo_id"
        assert "url" in data, "Response should contain url"
        assert "message" in data, "Response should contain message"
        
        # Store photo_id for cleanup
        self.uploaded_photo_id = data["photo_id"]
        print(f"✓ Photo uploaded successfully - ID: {data['photo_id']}")
        
        return data["photo_id"]
    
    def test_upload_gallery_photo_invalid_file(self):
        """Test POST /api/pets/{pet_id}/gallery - reject non-image file"""
        files = {
            'photo': ('test.txt', io.BytesIO(b"This is not an image"), 'text/plain')
        }
        
        headers = {"Authorization": f"Bearer {self.token}"}
        
        response = requests.post(
            f"{BASE_URL}/api/pets/{TEST_PET_ID}/gallery",
            files=files,
            headers=headers
        )
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print("✓ Correctly rejects non-image files")
    
    def test_upload_gallery_photo_nonexistent_pet(self):
        """Test POST /api/pets/{pet_id}/gallery - 404 for non-existent pet"""
        test_image = base64.b64decode(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        )
        
        files = {
            'photo': ('test_image.png', io.BytesIO(test_image), 'image/png')
        }
        
        headers = {"Authorization": f"Bearer {self.token}"}
        
        response = requests.post(
            f"{BASE_URL}/api/pets/nonexistent-pet-id/gallery",
            files=files,
            headers=headers
        )
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Returns 404 for non-existent pet on upload")
    
    def test_delete_gallery_photo(self):
        """Test DELETE /api/pets/{pet_id}/gallery/{photo_id}"""
        # First upload a photo
        test_image = base64.b64decode(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        )
        
        files = {
            'photo': ('test_delete.png', io.BytesIO(test_image), 'image/png')
        }
        
        headers = {"Authorization": f"Bearer {self.token}"}
        
        upload_response = requests.post(
            f"{BASE_URL}/api/pets/{TEST_PET_ID}/gallery",
            files=files,
            headers=headers
        )
        
        assert upload_response.status_code == 200, f"Upload failed: {upload_response.text}"
        photo_id = upload_response.json()["photo_id"]
        
        # Now delete the photo
        delete_response = requests.delete(
            f"{BASE_URL}/api/pets/{TEST_PET_ID}/gallery/{photo_id}",
            headers=headers
        )
        
        assert delete_response.status_code == 200, f"Expected 200, got {delete_response.status_code}: {delete_response.text}"
        
        data = delete_response.json()
        assert "message" in data, "Response should contain message"
        print(f"✓ Photo deleted successfully - ID: {photo_id}")
    
    def test_delete_nonexistent_photo(self):
        """Test DELETE /api/pets/{pet_id}/gallery/{photo_id} - 404 for non-existent photo"""
        headers = {"Authorization": f"Bearer {self.token}"}
        
        response = requests.delete(
            f"{BASE_URL}/api/pets/{TEST_PET_ID}/gallery/nonexistent-photo-id",
            headers=headers
        )
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Returns 404 for non-existent photo on delete")
    
    def test_set_main_photo(self):
        """Test POST /api/pets/{pet_id}/gallery/{photo_id}/set-main"""
        # First upload a photo
        test_image = base64.b64decode(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        )
        
        files = {
            'photo': ('test_main.png', io.BytesIO(test_image), 'image/png')
        }
        
        headers = {"Authorization": f"Bearer {self.token}"}
        
        upload_response = requests.post(
            f"{BASE_URL}/api/pets/{TEST_PET_ID}/gallery",
            files=files,
            headers=headers
        )
        
        assert upload_response.status_code == 200, f"Upload failed: {upload_response.text}"
        photo_id = upload_response.json()["photo_id"]
        
        # Set as main photo
        set_main_response = requests.post(
            f"{BASE_URL}/api/pets/{TEST_PET_ID}/gallery/{photo_id}/set-main",
            headers=headers
        )
        
        assert set_main_response.status_code == 200, f"Expected 200, got {set_main_response.status_code}: {set_main_response.text}"
        
        data = set_main_response.json()
        assert "message" in data, "Response should contain message"
        print(f"✓ Photo set as main successfully - ID: {photo_id}")
        
        # Cleanup - delete the test photo
        requests.delete(
            f"{BASE_URL}/api/pets/{TEST_PET_ID}/gallery/{photo_id}",
            headers=headers
        )
    
    def test_set_main_nonexistent_photo(self):
        """Test POST /api/pets/{pet_id}/gallery/{photo_id}/set-main - 404 for non-existent photo"""
        headers = {"Authorization": f"Bearer {self.token}"}
        
        response = requests.post(
            f"{BASE_URL}/api/pets/{TEST_PET_ID}/gallery/nonexistent-photo-id/set-main",
            headers=headers
        )
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Returns 404 for non-existent photo on set-main")
    
    def test_serve_gallery_photo(self):
        """Test GET /api/pets/{pet_id}/gallery/{photo_id} - serve specific photo"""
        # First upload a photo
        test_image = base64.b64decode(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        )
        
        files = {
            'photo': ('test_serve.png', io.BytesIO(test_image), 'image/png')
        }
        
        headers = {"Authorization": f"Bearer {self.token}"}
        
        upload_response = requests.post(
            f"{BASE_URL}/api/pets/{TEST_PET_ID}/gallery",
            files=files,
            headers=headers
        )
        
        assert upload_response.status_code == 200, f"Upload failed: {upload_response.text}"
        photo_id = upload_response.json()["photo_id"]
        
        # Serve the photo
        serve_response = requests.get(
            f"{BASE_URL}/api/pets/{TEST_PET_ID}/gallery/{photo_id}"
        )
        
        assert serve_response.status_code == 200, f"Expected 200, got {serve_response.status_code}"
        assert serve_response.headers.get('content-type', '').startswith('image/'), "Response should be an image"
        print(f"✓ Photo served successfully - ID: {photo_id}")
        
        # Cleanup
        requests.delete(
            f"{BASE_URL}/api/pets/{TEST_PET_ID}/gallery/{photo_id}",
            headers=headers
        )


class TestPetProfileAPI:
    """Test Pet Profile API for gallery integration"""
    
    def test_get_pet_profile(self):
        """Test GET /api/pets/{pet_id} returns pet data"""
        response = requests.get(f"{BASE_URL}/api/pets/{TEST_PET_ID}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        pet = data.get("pet", data)
        
        assert "id" in pet, "Pet should have id"
        assert "name" in pet, "Pet should have name"
        print(f"✓ Pet profile retrieved - Name: {pet.get('name')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
