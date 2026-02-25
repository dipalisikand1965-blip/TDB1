"""
Test iteration 193 - Bug fixes verification
Tests for:
1. Sign Out button in Member Dashboard (code verification)
2. Merge tickets functionality
3. Dine Seed All endpoint
4. Stay Seed All endpoint
5. Blog posts seed endpoint
6. Blog posts display
7. Site Status tab (Check icon import verification)
"""

import pytest
import requests
import os
import base64

# Get BASE_URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Admin credentials
ADMIN_USERNAME = "aditya"
ADMIN_PASSWORD = "lola4304"

# Member credentials
MEMBER_EMAIL = "dipali@clubconcierge.in"
MEMBER_PASSWORD = "test123"


def get_admin_auth_header():
    """Get Basic auth header for admin endpoints"""
    credentials = f"{ADMIN_USERNAME}:{ADMIN_PASSWORD}"
    encoded = base64.b64encode(credentials.encode()).decode()
    return {"Authorization": f"Basic {encoded}"}


class TestBlogPosts:
    """Test blog posts functionality"""
    
    def test_blog_posts_seed_endpoint(self):
        """Test POST /api/admin/blog-posts/seed endpoint"""
        response = requests.post(
            f"{BASE_URL}/api/admin/blog-posts/seed",
            headers=get_admin_auth_header()
        )
        assert response.status_code == 200
        data = response.json()
        assert "success" in data
        assert data["success"] == True
        print(f"Blog seed response: {data}")
    
    def test_blog_posts_display(self):
        """Test GET /api/blog-posts returns posts"""
        response = requests.get(f"{BASE_URL}/api/blog-posts")
        assert response.status_code == 200
        data = response.json()
        assert "posts" in data
        posts = data["posts"]
        assert isinstance(posts, list)
        print(f"Found {len(posts)} blog posts")
        if len(posts) > 0:
            # Verify post structure
            post = posts[0]
            assert "title" in post
            assert "slug" in post
            print(f"Sample post: {post.get('title')}")


class TestDineSeedAll:
    """Test Dine Seed All functionality"""
    
    def test_dine_seed_all_endpoint(self):
        """Test POST /api/admin/dine/seed-all endpoint"""
        response = requests.post(
            f"{BASE_URL}/api/admin/dine/seed-all",
            headers=get_admin_auth_header()
        )
        assert response.status_code == 200
        data = response.json()
        assert "success" in data
        assert data["success"] == True
        assert "results" in data
        print(f"Dine seed results: {data.get('results')}")
    
    def test_dine_seed_all_requires_auth(self):
        """Test that Dine seed-all requires admin auth"""
        response = requests.post(f"{BASE_URL}/api/admin/dine/seed-all")
        assert response.status_code == 401


class TestStaySeedAll:
    """Test Stay Seed All functionality"""
    
    def test_stay_seed_all_endpoint(self):
        """Test POST /api/admin/stay/seed-all endpoint"""
        response = requests.post(
            f"{BASE_URL}/api/admin/stay/seed-all",
            headers=get_admin_auth_header()
        )
        assert response.status_code == 200
        data = response.json()
        assert "success" in data
        assert data["success"] == True
        assert "results" in data
        print(f"Stay seed results: {data.get('results')}")
    
    def test_stay_seed_all_requires_auth(self):
        """Test that Stay seed-all requires admin auth"""
        response = requests.post(f"{BASE_URL}/api/admin/stay/seed-all")
        assert response.status_code == 401


class TestMergeTickets:
    """Test merge tickets functionality"""
    
    def test_merge_tickets_missing_params(self):
        """Test merge tickets returns 400 for missing params"""
        response = requests.post(
            f"{BASE_URL}/api/tickets/merge",
            headers=get_admin_auth_header(),
            json={}
        )
        assert response.status_code == 400
        data = response.json()
        assert "detail" in data
        assert "required" in data["detail"].lower()
        print(f"Missing params response: {data}")
    
    def test_merge_tickets_nonexistent_primary(self):
        """Test merge tickets returns 404 for non-existent primary ticket"""
        response = requests.post(
            f"{BASE_URL}/api/tickets/merge",
            headers=get_admin_auth_header(),
            json={
                "primary_ticket_id": "TKT-NONEXISTENT-001",
                "merge_ticket_ids": ["TKT-NONEXISTENT-002"]
            }
        )
        assert response.status_code == 404
        data = response.json()
        assert "detail" in data
        print(f"Non-existent ticket response: {data}")
    
    def test_merge_tickets_endpoint_exists(self):
        """Test that merge tickets endpoint exists and accepts POST"""
        response = requests.post(
            f"{BASE_URL}/api/tickets/merge",
            headers=get_admin_auth_header(),
            json={
                "primary_ticket_id": "test",
                "merge_ticket_ids": ["test2"]
            }
        )
        # Should return 404 (ticket not found) not 405 (method not allowed)
        assert response.status_code in [400, 404]


class TestMemberLogin:
    """Test member login functionality"""
    
    def test_member_login(self):
        """Test member login endpoint"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={
                "email": MEMBER_EMAIL,
                "password": MEMBER_PASSWORD
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "token" in data or "access_token" in data
        print(f"Login successful for {MEMBER_EMAIL}")


class TestAdminAuth:
    """Test admin authentication"""
    
    def test_admin_auth_valid(self):
        """Test admin auth with valid credentials"""
        response = requests.get(
            f"{BASE_URL}/api/admin/dashboard",
            headers=get_admin_auth_header()
        )
        assert response.status_code == 200
        print("Admin auth successful")
    
    def test_admin_auth_invalid(self):
        """Test admin auth with invalid credentials"""
        invalid_auth = base64.b64encode(b"wrong:wrong").decode()
        response = requests.get(
            f"{BASE_URL}/api/admin/dashboard",
            headers={"Authorization": f"Basic {invalid_auth}"}
        )
        assert response.status_code == 401


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
