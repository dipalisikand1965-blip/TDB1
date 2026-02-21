"""
Test suite for Admin Docs and Page CMS functionality
Tests:
1. Admin Docs - Smart Recommendations Engine documentation
2. Page CMS - CRUD operations for page content
"""

import pytest
import requests
import os
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
ADMIN_USERNAME = "aditya"
ADMIN_PASSWORD = "lola4304"


class TestAdminDocsSmartEngine:
    """Tests for Smart Recommendations Engine documentation in Admin Docs"""
    
    def test_smart_recommendations_api_exists(self):
        """Test that the smart recommendations API endpoint exists"""
        # Test the smart recommendations endpoint
        response = requests.get(
            f"{BASE_URL}/api/smart/recommendations/test-user",
            auth=(ADMIN_USERNAME, ADMIN_PASSWORD)
        )
        # Should return 200 or 404 (if user not found), not 500
        assert response.status_code in [200, 404, 422], f"Unexpected status: {response.status_code}"
    
    def test_smart_mira_context_api_exists(self):
        """Test that the Mira context API endpoint exists"""
        response = requests.get(
            f"{BASE_URL}/api/smart/mira-context/test-pet-id",
            auth=(ADMIN_USERNAME, ADMIN_PASSWORD)
        )
        # Should return 200 or 404 (if pet not found), not 500
        assert response.status_code in [200, 404, 422], f"Unexpected status: {response.status_code}"
    
    def test_smart_birthday_reminders_api_exists(self):
        """Test that the birthday reminders API endpoint exists"""
        response = requests.get(
            f"{BASE_URL}/api/smart/birthday-reminders",
            params={"days_ahead": 30},
            auth=(ADMIN_USERNAME, ADMIN_PASSWORD)
        )
        # Should return 200 or 401 (if auth required), not 500
        assert response.status_code in [200, 401, 403], f"Unexpected status: {response.status_code}"


class TestPageCMSAPI:
    """Tests for Page CMS API endpoints"""
    
    @pytest.fixture
    def auth(self):
        return (ADMIN_USERNAME, ADMIN_PASSWORD)
    
    def test_get_all_pages(self, auth):
        """Test GET /api/admin/pages - List all pages"""
        response = requests.get(
            f"{BASE_URL}/api/admin/pages",
            auth=auth
        )
        assert response.status_code == 200
        data = response.json()
        assert "pages" in data
        assert "total" in data
        assert isinstance(data["pages"], list)
        print(f"✅ Found {data['total']} pages")
    
    def test_get_page_content_existing(self, auth):
        """Test GET /api/admin/pages/{slug} - Get existing page"""
        response = requests.get(
            f"{BASE_URL}/api/admin/pages/membership",
            auth=auth
        )
        assert response.status_code == 200
        data = response.json()
        assert "slug" in data
        assert data["slug"] == "membership"
        print(f"✅ Retrieved membership page content")
    
    def test_get_page_content_new(self, auth):
        """Test GET /api/admin/pages/{slug} - Get non-existing page returns default"""
        response = requests.get(
            f"{BASE_URL}/api/admin/pages/test-new-page-xyz",
            auth=auth
        )
        assert response.status_code == 200
        data = response.json()
        assert "slug" in data
        assert data["slug"] == "test-new-page-xyz"
        assert data.get("is_published") == False
        print(f"✅ New page returns default structure")
    
    def test_update_page_content(self, auth):
        """Test PUT /api/admin/pages/{slug} - Update page content"""
        test_slug = "test-page-cms"
        test_title = f"Test Page - {datetime.now().isoformat()}"
        
        # Update page content
        response = requests.put(
            f"{BASE_URL}/api/admin/pages/{test_slug}",
            auth=auth,
            json={
                "title": test_title,
                "content": {
                    "hero": {
                        "badge": "Test Badge",
                        "title": test_title,
                        "highlight": "Test Highlight",
                        "subtitle": "Test Subtitle"
                    }
                },
                "is_published": False
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        print(f"✅ Page updated successfully")
        
        # Verify the update persisted
        verify_response = requests.get(
            f"{BASE_URL}/api/admin/pages/{test_slug}",
            auth=auth
        )
        assert verify_response.status_code == 200
        verify_data = verify_response.json()
        assert verify_data["title"] == test_title
        assert verify_data["content"]["hero"]["title"] == test_title
        print(f"✅ Page content persisted correctly")
    
    def test_public_page_content_endpoint(self):
        """Test GET /api/pages/{slug} - Public page content"""
        response = requests.get(f"{BASE_URL}/api/pages/about")
        assert response.status_code == 200
        data = response.json()
        assert "slug" in data
        print(f"✅ Public page endpoint works")
    
    def test_page_cms_unauthorized(self):
        """Test that Page CMS requires authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/pages")
        assert response.status_code == 401
        print(f"✅ Unauthorized access correctly rejected")
    
    def test_page_cms_wrong_credentials(self):
        """Test that Page CMS rejects wrong credentials"""
        response = requests.get(
            f"{BASE_URL}/api/admin/pages",
            auth=("wrong", "credentials")
        )
        assert response.status_code == 401
        print(f"✅ Wrong credentials correctly rejected")


class TestPageCMSPillarPages:
    """Tests for pillar page content in Page CMS"""
    
    @pytest.fixture
    def auth(self):
        return (ADMIN_USERNAME, ADMIN_PASSWORD)
    
    def test_pillar_pages_accessible(self, auth):
        """Test that all 12 pillar pages are accessible"""
        pillars = [
            "celebrate", "dine", "travel", "stay", "care", "enjoy",
            "fit", "advisory", "emergency", "paperwork", "shop", "club"
        ]
        
        for pillar in pillars:
            response = requests.get(
                f"{BASE_URL}/api/admin/pages/{pillar}",
                auth=auth
            )
            assert response.status_code == 200, f"Failed for pillar: {pillar}"
            data = response.json()
            assert data["slug"] == pillar
        
        print(f"✅ All 12 pillar pages accessible")
    
    def test_core_pages_accessible(self, auth):
        """Test that core pages are accessible"""
        core_pages = ["home", "about", "membership"]
        
        for page in core_pages:
            response = requests.get(
                f"{BASE_URL}/api/admin/pages/{page}",
                auth=auth
            )
            assert response.status_code == 200, f"Failed for page: {page}"
        
        print(f"✅ All core pages accessible")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
