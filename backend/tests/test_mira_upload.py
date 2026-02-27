"""
Test file for Mira Upload API - Document/Image upload functionality
Tests: POST /api/mira/upload/file endpoint
"""
import pytest
import requests
import os
import base64

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestMiraUploadAPI:
    """Tests for Mira Upload API endpoints"""
    
    def test_upload_valid_image(self):
        """Test uploading a valid PNG image"""
        # Create a test PNG file (1x1 pixel)
        png_data = base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==')
        
        files = {'file': ('test_image.png', png_data, 'image/png')}
        data = {
            'pet_id': 'test-pet-123',
            'context': 'concierge_upload'
        }
        
        response = requests.post(f"{BASE_URL}/api/mira/upload/file", files=files, data=data)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        result = response.json()
        assert 'upload_id' in result, "Response should contain upload_id"
        assert 'filename' in result, "Response should contain filename"
        assert result['filename'] == 'test_image.png', f"Filename mismatch: {result['filename']}"
        assert result['file_type'] == 'image', f"File type should be 'image', got {result['file_type']}"
        assert result['status'] == 'uploaded', f"Status should be 'uploaded', got {result['status']}"
        print(f"PASS: Image upload successful - upload_id: {result['upload_id']}")
    
    def test_upload_invalid_file_type(self):
        """Test uploading an invalid file type (should be rejected)"""
        files = {'file': ('test.txt', b'Hello World', 'text/plain')}
        data = {
            'pet_id': 'test-pet-123',
            'context': 'test'
        }
        
        response = requests.post(f"{BASE_URL}/api/mira/upload/file", files=files, data=data)
        
        assert response.status_code == 400, f"Expected 400 for invalid file type, got {response.status_code}"
        
        result = response.json()
        assert 'detail' in result, "Error response should contain detail"
        assert 'Unsupported file type' in result['detail'], f"Expected 'Unsupported file type' in error, got: {result['detail']}"
        print(f"PASS: Invalid file type correctly rejected")
    
    def test_upload_without_pet_id(self):
        """Test uploading without pet_id (should fail with validation error)"""
        png_data = base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==')
        
        files = {'file': ('test_image.png', png_data, 'image/png')}
        # No pet_id provided
        data = {'context': 'test'}
        
        response = requests.post(f"{BASE_URL}/api/mira/upload/file", files=files, data=data)
        
        # FastAPI should return 422 for missing required field
        assert response.status_code == 422, f"Expected 422 for missing pet_id, got {response.status_code}"
        print(f"PASS: Missing pet_id correctly validated")
    
    def test_upload_response_structure(self):
        """Test that upload response has all expected fields"""
        png_data = base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8DwHwAFBQIAX8jx0gAAAABJRU5ErkJggg==')
        
        files = {'file': ('structure_test.png', png_data, 'image/png')}
        data = {
            'pet_id': 'test-pet-456',
            'context': 'structure_test'
        }
        
        response = requests.post(f"{BASE_URL}/api/mira/upload/file", files=files, data=data)
        
        assert response.status_code == 200
        
        result = response.json()
        
        # Verify all expected fields
        expected_fields = ['upload_id', 'filename', 'file_type', 'file_size', 'analysis', 'status']
        for field in expected_fields:
            assert field in result, f"Missing field: {field}"
        
        # Verify field types/values
        assert result['upload_id'].startswith('upload-'), f"upload_id should start with 'upload-'"
        assert isinstance(result['file_size'], int), f"file_size should be int, got {type(result['file_size'])}"
        assert result['file_size'] > 0, f"file_size should be > 0"
        print(f"PASS: Response structure correct - all {len(expected_fields)} fields present")


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
