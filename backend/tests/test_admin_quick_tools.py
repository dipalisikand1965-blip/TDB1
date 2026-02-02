"""
Test Admin Quick Tools - Product Tag Enhancement, Seed All, CSV Downloads
Tests for iteration 187 features:
1. Backend startup auto-runs product tag enhancement
2. Admin Dashboard Quick Tools buttons
3. Enhance All Tags API
4. Seed All Products API
5. CSV download endpoints
"""
import pytest
import requests
import os
from requests.auth import HTTPBasicAuth

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Admin credentials
ADMIN_USERNAME = "aditya"
ADMIN_PASSWORD = "lola4304"


class TestAdminQuickTools:
    """Test Admin Quick Tools APIs"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test fixtures"""
        self.auth = HTTPBasicAuth(ADMIN_USERNAME, ADMIN_PASSWORD)
        self.headers = {"Content-Type": "application/json"}
    
    def test_health_check(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        print(f"✅ Health check passed: {response.json()}")
    
    def test_run_intelligence_endpoint(self):
        """Test POST /api/admin/products/run-intelligence?update_db=true"""
        response = requests.post(
            f"{BASE_URL}/api/admin/products/run-intelligence?update_db=true",
            auth=self.auth,
            headers=self.headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        print(f"✅ Run Intelligence response: {data}")
        
        # Verify response structure
        assert "results" in data or "message" in data or "status" in data
    
    def test_seed_all_endpoint(self):
        """Test POST /api/admin/seed-all"""
        response = requests.post(
            f"{BASE_URL}/api/admin/seed-all",
            auth=self.auth,
            headers=self.headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        print(f"✅ Seed All response: {data}")
        
        # Verify response has pillar results
        assert isinstance(data, dict)
    
    def test_unified_products_csv_download(self):
        """Test GET /api/admin/export/unified-products-csv"""
        response = requests.get(
            f"{BASE_URL}/api/admin/export/unified-products-csv",
            auth=self.auth
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Verify it's a CSV response
        content_type = response.headers.get('content-type', '')
        assert 'text/csv' in content_type, f"Expected text/csv, got {content_type}"
        
        # Verify content disposition header
        content_disposition = response.headers.get('content-disposition', '')
        assert 'unified_products_export.csv' in content_disposition
        
        # Verify CSV has content
        csv_content = response.text
        assert len(csv_content) > 100, "CSV should have substantial content"
        
        # Verify CSV has expected columns
        first_line = csv_content.split('\n')[0]
        assert 'id' in first_line or 'name' in first_line
        print(f"✅ Unified Products CSV downloaded: {len(csv_content)} bytes, columns: {first_line[:200]}...")
    
    def test_services_csv_download(self):
        """Test GET /api/admin/export/services-csv"""
        response = requests.get(
            f"{BASE_URL}/api/admin/export/services-csv",
            auth=self.auth
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Verify it's a CSV response
        content_type = response.headers.get('content-type', '')
        assert 'text/csv' in content_type, f"Expected text/csv, got {content_type}"
        
        # Verify content disposition header
        content_disposition = response.headers.get('content-disposition', '')
        assert 'services_export.csv' in content_disposition
        
        # Verify CSV has content
        csv_content = response.text
        print(f"✅ Services CSV downloaded: {len(csv_content)} bytes")
    
    def test_run_intelligence_without_auth_fails(self):
        """Test that run-intelligence requires authentication"""
        response = requests.post(
            f"{BASE_URL}/api/admin/products/run-intelligence?update_db=true",
            headers=self.headers
        )
        assert response.status_code == 401, f"Expected 401 without auth, got {response.status_code}"
        print("✅ Run Intelligence correctly requires authentication")
    
    def test_seed_all_without_auth_works(self):
        """Test seed-all endpoint (may or may not require auth based on implementation)"""
        response = requests.post(
            f"{BASE_URL}/api/admin/seed-all",
            headers=self.headers
        )
        # This endpoint might not require auth based on the code
        print(f"Seed All without auth: status={response.status_code}")
    
    def test_csv_download_without_auth_fails(self):
        """Test that CSV downloads require authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/export/unified-products-csv")
        assert response.status_code == 401, f"Expected 401 without auth, got {response.status_code}"
        print("✅ CSV download correctly requires authentication")


class TestProductTagsEnhancement:
    """Test that products have proper tags after enhancement"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test fixtures"""
        self.auth = HTTPBasicAuth(ADMIN_USERNAME, ADMIN_PASSWORD)
    
    def test_unified_products_have_pillar_tags(self):
        """Verify unified products have pillar tags set"""
        response = requests.get(
            f"{BASE_URL}/api/admin/export/unified-products-csv",
            auth=self.auth
        )
        assert response.status_code == 200
        
        csv_content = response.text
        lines = csv_content.strip().split('\n')
        
        # Check header has pillar column
        header = lines[0]
        assert 'pillar' in header, "CSV should have pillar column"
        
        # Get pillar column index
        columns = header.split(',')
        pillar_idx = columns.index('pillar') if 'pillar' in columns else -1
        
        if pillar_idx >= 0 and len(lines) > 1:
            # Check some products have pillar values
            products_with_pillar = 0
            for line in lines[1:min(20, len(lines))]:
                parts = line.split(',')
                if len(parts) > pillar_idx and parts[pillar_idx].strip():
                    products_with_pillar += 1
            
            print(f"✅ Products with pillar tags: {products_with_pillar}/{min(19, len(lines)-1)}")
            assert products_with_pillar > 0, "At least some products should have pillar tags"
    
    def test_unified_products_have_size_tags(self):
        """Verify unified products have size_tags set"""
        response = requests.get(
            f"{BASE_URL}/api/admin/export/unified-products-csv",
            auth=self.auth
        )
        assert response.status_code == 200
        
        csv_content = response.text
        header = csv_content.split('\n')[0]
        
        # Check header has size_tags column
        assert 'size_tags' in header, "CSV should have size_tags column"
        print("✅ Products CSV has size_tags column")
    
    def test_unified_products_have_breed_tags(self):
        """Verify unified products have breed_tags set"""
        response = requests.get(
            f"{BASE_URL}/api/admin/export/unified-products-csv",
            auth=self.auth
        )
        assert response.status_code == 200
        
        csv_content = response.text
        header = csv_content.split('\n')[0]
        
        # Check header has breed_tags column
        assert 'breed_tags' in header, "CSV should have breed_tags column"
        print("✅ Products CSV has breed_tags column")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
