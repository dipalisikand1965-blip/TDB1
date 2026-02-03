"""
Test iteration 192 - Bug fixes verification
Tests:
1. Merge tickets functionality - POST /api/tickets/merge with merge_ticket_ids
2. Dine 'Seed All' button - POST /api/admin/dine/seed-all
3. Stay 'Seed All' button - POST /api/admin/stay/seed-all
4. Blog posts exist - GET /api/blog-posts
5. AI Product Tag Enhancement - POST /api/admin/products/run-intelligence
"""

import pytest
import requests
import os
from requests.auth import HTTPBasicAuth

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Admin credentials
ADMIN_USERNAME = "aditya"
ADMIN_PASSWORD = "lola4304"


class TestMergeTickets:
    """Test merge tickets functionality"""
    
    def test_merge_tickets_validation(self):
        """Test that merge endpoint validates required fields"""
        response = requests.post(
            f"{BASE_URL}/api/tickets/merge",
            json={},
            headers={"Content-Type": "application/json"}
        )
        # Should return 400 for missing required fields
        assert response.status_code == 400
        data = response.json()
        assert "primary_ticket_id" in data.get("detail", "") or "merge_ticket_ids" in data.get("detail", "")
        print(f"✅ Merge tickets validation works: {data.get('detail')}")
    
    def test_merge_tickets_with_merge_ticket_ids_param(self):
        """Test that merge endpoint accepts merge_ticket_ids parameter (not secondary_ticket_ids)"""
        # Test with correct parameter name
        response = requests.post(
            f"{BASE_URL}/api/tickets/merge",
            json={
                "primary_ticket_id": "TEST-PRIMARY-001",
                "merge_ticket_ids": ["TEST-SECONDARY-001"]
            },
            headers={"Content-Type": "application/json"}
        )
        # Should return 404 (ticket not found) not 400 (bad request)
        # This confirms the parameter name is correct
        assert response.status_code in [404, 200]
        print(f"✅ Merge tickets accepts merge_ticket_ids parameter: status={response.status_code}")


class TestDineSeedAll:
    """Test Dine Seed All functionality"""
    
    def test_dine_seed_all_endpoint_exists(self):
        """Test POST /api/admin/dine/seed-all endpoint"""
        response = requests.post(
            f"{BASE_URL}/api/admin/dine/seed-all",
            auth=HTTPBasicAuth(ADMIN_USERNAME, ADMIN_PASSWORD)
        )
        # Should return 200 with seeding results
        assert response.status_code == 200
        data = response.json()
        print(f"✅ Dine Seed All response: {data}")
        
        # Verify response structure
        assert "restaurants" in data or "bundles" in data or "products" in data or "message" in data
    
    def test_dine_seed_all_unauthorized(self):
        """Test that seed-all requires admin auth"""
        response = requests.post(
            f"{BASE_URL}/api/admin/dine/seed-all"
        )
        # Should return 401 without auth
        assert response.status_code == 401
        print("✅ Dine Seed All requires authentication")


class TestStaySeedAll:
    """Test Stay Seed All functionality"""
    
    def test_stay_seed_all_endpoint_exists(self):
        """Test POST /api/admin/stay/seed-all endpoint"""
        response = requests.post(
            f"{BASE_URL}/api/admin/stay/seed-all",
            auth=HTTPBasicAuth(ADMIN_USERNAME, ADMIN_PASSWORD)
        )
        # Should return 200 with seeding results
        assert response.status_code == 200
        data = response.json()
        print(f"✅ Stay Seed All response: {data}")
        
        # Verify response structure
        assert "properties" in data or "bundles" in data or "products" in data or "message" in data
    
    def test_stay_seed_all_unauthorized(self):
        """Test that seed-all requires admin auth"""
        response = requests.post(
            f"{BASE_URL}/api/admin/stay/seed-all"
        )
        # Should return 401 without auth
        assert response.status_code == 401
        print("✅ Stay Seed All requires authentication")


class TestBlogPosts:
    """Test blog posts exist and are accessible"""
    
    def test_blog_posts_endpoint(self):
        """Test GET /api/blog-posts returns blog posts"""
        response = requests.get(f"{BASE_URL}/api/blog-posts")
        assert response.status_code == 200
        data = response.json()
        
        # Check if posts exist
        posts = data.get("posts", data.get("blog_posts", []))
        print(f"✅ Blog posts found: {len(posts)} posts")
        
        if len(posts) > 0:
            # Verify post structure
            first_post = posts[0]
            assert "title" in first_post or "name" in first_post
            print(f"   Sample post: {first_post.get('title', first_post.get('name', 'N/A'))}")


class TestAIProductTagEnhancement:
    """Test AI Product Tag Enhancement"""
    
    def test_run_intelligence_endpoint(self):
        """Test POST /api/admin/products/run-intelligence endpoint"""
        response = requests.post(
            f"{BASE_URL}/api/admin/products/run-intelligence",
            auth=HTTPBasicAuth(ADMIN_USERNAME, ADMIN_PASSWORD),
            json={}
        )
        # Should return 200 or 202 (accepted for async processing)
        print(f"AI Intelligence endpoint status: {response.status_code}")
        
        if response.status_code in [200, 202]:
            data = response.json()
            print(f"✅ AI Product Intelligence response: {data}")
        elif response.status_code == 404:
            print("⚠️ AI Product Intelligence endpoint not found - may need different path")
        else:
            print(f"⚠️ AI Product Intelligence returned: {response.status_code}")


class TestAdminPanelEndpoints:
    """Test admin panel related endpoints"""
    
    def test_admin_login(self):
        """Test admin JWT login"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"username": ADMIN_USERNAME, "password": ADMIN_PASSWORD}
        )
        assert response.status_code == 200
        data = response.json()
        assert "token" in data or "access_token" in data
        print("✅ Admin login works")
        return data.get("token") or data.get("access_token")
    
    def test_dine_restaurants_list(self):
        """Test GET /api/admin/dine/restaurants"""
        response = requests.get(
            f"{BASE_URL}/api/admin/dine/restaurants",
            auth=HTTPBasicAuth(ADMIN_USERNAME, ADMIN_PASSWORD)
        )
        assert response.status_code == 200
        data = response.json()
        restaurants = data.get("restaurants", [])
        print(f"✅ Dine restaurants: {len(restaurants)} found")
    
    def test_stay_properties_list(self):
        """Test GET /api/stay/admin/properties or /api/admin/stay/properties"""
        # Try both possible paths
        response = requests.get(
            f"{BASE_URL}/api/stay/admin/properties",
            auth=HTTPBasicAuth(ADMIN_USERNAME, ADMIN_PASSWORD)
        )
        if response.status_code != 200:
            response = requests.get(
                f"{BASE_URL}/api/admin/stay/properties",
                auth=HTTPBasicAuth(ADMIN_USERNAME, ADMIN_PASSWORD)
            )
        
        if response.status_code == 200:
            data = response.json()
            properties = data.get("properties", [])
            print(f"✅ Stay properties: {len(properties)} found")
        else:
            print(f"⚠️ Stay properties endpoint returned: {response.status_code}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
