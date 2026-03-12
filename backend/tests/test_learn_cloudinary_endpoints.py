"""
Backend tests for Learn page features, Cloudinary upload endpoints, and post-deployment commands
Tests: Admin image upload, AI image endpoints, cleanup/fix endpoints
"""
import pytest
import requests
import os
import io

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_PASSWORD = "lola4304"
ADMIN_USERNAME = "aditya"


class TestHealthCheck:
    """Health check - verify backend is running"""
    
    def test_health_endpoint(self):
        """Test backend health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200, f"Health check failed: {response.status_code}"
        print(f"✓ Health check passed: {response.status_code}")


class TestLearnPageEndpoints:
    """Learn page product and service endpoints"""
    
    def test_learn_products_endpoint(self):
        """Test /api/learn/products endpoint"""
        response = requests.get(f"{BASE_URL}/api/learn/products?limit=10")
        assert response.status_code == 200, f"Learn products failed: {response.status_code}"
        data = response.json()
        assert "products" in data, "Missing products key in response"
        print(f"✓ Learn products: {len(data.get('products', []))} products returned")
    
    def test_learn_bundles_endpoint(self):
        """Test /api/learn/bundles endpoint"""
        response = requests.get(f"{BASE_URL}/api/learn/bundles")
        assert response.status_code == 200, f"Learn bundles failed: {response.status_code}"
        data = response.json()
        assert "bundles" in data, "Missing bundles key in response"
        print(f"✓ Learn bundles: {len(data.get('bundles', []))} bundles returned")
    
    def test_learn_programs_endpoint(self):
        """Test /api/learn/programs endpoint"""
        response = requests.get(f"{BASE_URL}/api/learn/programs")
        assert response.status_code == 200, f"Learn programs failed: {response.status_code}"
        data = response.json()
        assert "programs" in data, "Missing programs key in response"
        print(f"✓ Learn programs: {len(data.get('programs', []))} programs returned")
    
    def test_products_with_pillar_filter(self):
        """Test general products endpoint with pillar=learn filter"""
        response = requests.get(f"{BASE_URL}/api/products?pillar=learn&limit=20")
        assert response.status_code == 200, f"Products with pillar failed: {response.status_code}"
        data = response.json()
        assert "products" in data, "Missing products key in response"
        print(f"✓ Products with pillar=learn: {data.get('count', len(data.get('products', [])))} products")


class TestAdvisoryPageEndpoints:
    """Advisory page endpoints for comparison"""
    
    def test_advisory_products_endpoint(self):
        """Test /api/advisory/products endpoint"""
        response = requests.get(f"{BASE_URL}/api/advisory/products?limit=10")
        assert response.status_code == 200, f"Advisory products failed: {response.status_code}"
        data = response.json()
        assert "products" in data, "Missing products key in response"
        print(f"✓ Advisory products: {len(data.get('products', []))} products returned")


class TestAIImageEndpoints:
    """AI image generation status and stats endpoints"""
    
    def test_ai_images_status(self):
        """Test GET /api/ai-images/status endpoint"""
        response = requests.get(f"{BASE_URL}/api/ai-images/status")
        assert response.status_code == 200, f"AI images status failed: {response.status_code}"
        data = response.json()
        # Verify response structure
        expected_fields = ["running", "total", "completed", "failed", "progress"]
        for field in expected_fields:
            assert field in data, f"Missing field: {field}"
        print(f"✓ AI images status: running={data.get('running')}, progress={data.get('progress')}%")
    
    def test_ai_images_stats(self):
        """Test GET /api/ai-images/stats endpoint"""
        response = requests.get(f"{BASE_URL}/api/ai-images/stats")
        assert response.status_code == 200, f"AI images stats failed: {response.status_code}"
        data = response.json()
        # Stats should have some structure
        assert isinstance(data, dict), "Stats should return a dictionary"
        print(f"✓ AI images stats: {list(data.keys())}")


class TestAdminUploadEndpoints:
    """Admin Cloudinary upload endpoints for products and services"""
    
    def test_product_upload_without_file(self):
        """Test POST /api/admin/product/{id}/upload-image - validates file requirement"""
        # This should return 422 (validation error) without a file
        response = requests.post(f"{BASE_URL}/api/admin/product/test-product/upload-image")
        # Expect 422 for missing file (validation error)
        assert response.status_code == 422, f"Expected 422, got: {response.status_code}"
        print(f"✓ Product upload validation: correctly requires file (422)")
    
    def test_product_upload_invalid_content_type(self):
        """Test POST /api/admin/product/{id}/upload-image - validates file type"""
        # Send invalid file type (text instead of image)
        files = {"file": ("test.txt", io.BytesIO(b"not an image"), "text/plain")}
        response = requests.post(
            f"{BASE_URL}/api/admin/product/test-product/upload-image",
            files=files
        )
        # Should return 400 for invalid file type
        assert response.status_code == 400, f"Expected 400, got: {response.status_code}"
        assert "Invalid file type" in response.json().get("detail", ""), "Should reject non-image files"
        print(f"✓ Product upload validation: correctly rejects non-image files (400)")
    
    def test_service_upload_without_file(self):
        """Test POST /api/admin/service/{id}/upload-image - validates file requirement"""
        response = requests.post(f"{BASE_URL}/api/admin/service/test-service/upload-image")
        # Expect 422 for missing file (validation error)
        assert response.status_code == 422, f"Expected 422, got: {response.status_code}"
        print(f"✓ Service upload validation: correctly requires file (422)")
    
    def test_service_upload_invalid_content_type(self):
        """Test POST /api/admin/service/{id}/upload-image - validates file type"""
        files = {"file": ("test.pdf", io.BytesIO(b"not an image"), "application/pdf")}
        response = requests.post(
            f"{BASE_URL}/api/admin/service/test-service/upload-image",
            files=files
        )
        # Should return 400 for invalid file type
        assert response.status_code == 400, f"Expected 400, got: {response.status_code}"
        assert "Invalid file type" in response.json().get("detail", ""), "Should reject non-image files"
        print(f"✓ Service upload validation: correctly rejects non-image files (400)")


class TestPostDeploymentEndpoints:
    """Post-deployment cleanup and fix endpoints"""
    
    def test_cleanup_duplicate_services_requires_password(self):
        """Test POST /api/admin/cleanup-duplicate-services requires password"""
        response = requests.post(f"{BASE_URL}/api/admin/cleanup-duplicate-services")
        # Should return 422 for missing required password
        assert response.status_code == 422, f"Expected 422 for missing password, got: {response.status_code}"
        print(f"✓ Cleanup duplicates: requires password (422)")
    
    def test_cleanup_duplicate_services_invalid_password(self):
        """Test POST /api/admin/cleanup-duplicate-services with wrong password"""
        response = requests.post(f"{BASE_URL}/api/admin/cleanup-duplicate-services?password=wrong")
        # Should return 403 for invalid password
        assert response.status_code == 403, f"Expected 403 for invalid password, got: {response.status_code}"
        print(f"✓ Cleanup duplicates: rejects invalid password (403)")
    
    def test_cleanup_duplicate_services_valid(self):
        """Test POST /api/admin/cleanup-duplicate-services with valid password"""
        response = requests.post(f"{BASE_URL}/api/admin/cleanup-duplicate-services?password={ADMIN_PASSWORD}")
        assert response.status_code == 200, f"Cleanup failed: {response.status_code}, {response.text}"
        data = response.json()
        assert "duplicates_found" in data, "Missing duplicates_found field"
        assert "duplicates_removed" in data, "Missing duplicates_removed field"
        print(f"✓ Cleanup duplicates: found={data.get('duplicates_found')}, removed={data.get('duplicates_removed')}")
    
    def test_fix_service_images_requires_password(self):
        """Test POST /api/admin/fix-service-images requires password"""
        response = requests.post(f"{BASE_URL}/api/admin/fix-service-images")
        # Should return 422 for missing required password
        assert response.status_code == 422, f"Expected 422 for missing password, got: {response.status_code}"
        print(f"✓ Fix service images: requires password (422)")
    
    def test_fix_service_images_invalid_password(self):
        """Test POST /api/admin/fix-service-images with wrong password"""
        response = requests.post(f"{BASE_URL}/api/admin/fix-service-images?password=wrong")
        # Should return 403 for invalid password
        assert response.status_code == 403, f"Expected 403 for invalid password, got: {response.status_code}"
        print(f"✓ Fix service images: rejects invalid password (403)")
    
    def test_fix_service_images_valid(self):
        """Test POST /api/admin/fix-service-images with valid password"""
        response = requests.post(f"{BASE_URL}/api/admin/fix-service-images?password={ADMIN_PASSWORD}")
        assert response.status_code == 200, f"Fix images failed: {response.status_code}, {response.text}"
        data = response.json()
        assert "success" in data, "Missing success field"
        assert "services_updated" in data, "Missing services_updated field"
        print(f"✓ Fix service images: success={data.get('success')}, updated={data.get('services_updated')}")


class TestAdminLogin:
    """Admin login endpoint"""
    
    def test_admin_login(self):
        """Test admin login with valid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200, f"Admin login failed: {response.status_code}"
        data = response.json()
        assert "token" in data or "success" in data, "Missing token/success in response"
        print(f"✓ Admin login successful")
    
    def test_admin_login_invalid(self):
        """Test admin login with invalid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"username": "wrong", "password": "wrong"}
        )
        # Should not return 200 for invalid credentials
        assert response.status_code != 200, "Should reject invalid credentials"
        print(f"✓ Admin login rejects invalid credentials ({response.status_code})")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
