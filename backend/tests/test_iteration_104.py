"""
Test Suite for Iteration 104: Bug Fixes and Feature Additions
- 14 Soul Pillars verification
- Push notification VAPID key format
- Service Desk Analytics section
- Review submission API
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://petlifecentral.preview.emergentagent.com')

class TestVAPIDKey:
    """Test VAPID key format for push notifications"""
    
    def test_vapid_public_key_endpoint(self):
        """GET /api/push/vapid-public-key should return base64 formatted key"""
        response = requests.get(f"{BASE_URL}/api/push/vapid-public-key")
        assert response.status_code == 200
        
        data = response.json()
        assert "public_key" in data
        
        # VAPID public key should be URL-safe base64 format
        # It should start with 'B' (typical for VAPID keys) and be ~87 chars
        public_key = data["public_key"]
        assert public_key.startswith("B"), f"VAPID key should start with 'B', got: {public_key[:10]}..."
        assert len(public_key) >= 80, f"VAPID key too short: {len(public_key)} chars"
        
        # Should not contain hex characters only (old format was hex)
        # Base64 uses A-Z, a-z, 0-9, +, /, = (or URL-safe: -, _)
        import re
        is_base64 = bool(re.match(r'^[A-Za-z0-9_-]+$', public_key))
        assert is_base64, f"VAPID key should be URL-safe base64 format"
        
        print(f"✓ VAPID public key is in correct base64 format: {public_key[:20]}...")


class TestReviewAPI:
    """Test review submission API"""
    
    def test_create_review_success(self):
        """POST /api/reviews should create a review"""
        review_data = {
            "product_id": "test-product-iteration-104",
            "rating": 5,
            "title": "Great product for testing",
            "comment": "My dog absolutely loves this! Testing iteration 104.",
            "reviewer_name": "Test User 104",
            "reviewer_email": "test104@example.com"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/reviews",
            json=review_data,
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200
        
        data = response.json()
        assert "message" in data
        assert "review" in data
        assert data["review"]["rating"] == 5
        assert data["review"]["author_name"] == "Test User 104"
        assert data["review"]["status"] == "pending"
        
        print(f"✓ Review created successfully: {data['review']['id']}")
    
    def test_create_review_missing_comment(self):
        """POST /api/reviews should fail without comment field"""
        review_data = {
            "product_id": "test-product",
            "rating": 4,
            "title": "Test",
            "content": "This should fail - wrong field name"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/reviews",
            json=review_data,
            headers={"Content-Type": "application/json"}
        )
        
        # Should return 422 for validation error
        assert response.status_code == 422
        print("✓ Review API correctly validates required 'comment' field")


class TestTicketsAnalytics:
    """Test tickets analytics API"""
    
    def test_tickets_analytics_endpoint(self):
        """GET /api/tickets/analytics should return analytics data"""
        import base64
        auth_header = base64.b64encode(b"aditya:lola4304").decode()
        
        response = requests.get(
            f"{BASE_URL}/api/tickets/analytics",
            headers={"Authorization": f"Basic {auth_header}"}
        )
        
        assert response.status_code == 200
        
        data = response.json()
        
        # Verify required fields
        assert "total_tickets" in data
        assert "open_tickets" in data
        assert "resolved_tickets" in data
        assert "by_category" in data
        assert "by_priority" in data
        
        print(f"✓ Analytics API working - Total tickets: {data['total_tickets']}")
        print(f"  - Open: {data['open_tickets']}")
        print(f"  - Resolved: {data['resolved_tickets']}")
        print(f"  - By category: {list(data['by_category'].keys())}")


class TestSoulPillars:
    """Test that 14 Soul Pillars are defined"""
    
    def test_pillars_count_in_code(self):
        """Verify 14 pillars are defined in frontend components"""
        # Read SoulExplainerVideo.jsx
        with open('/app/frontend/src/components/SoulExplainerVideo.jsx', 'r') as f:
            content = f.read()
        
        # Count pillar definitions in the pillars array
        pillars_in_explainer = content.count("{ name: '")
        assert pillars_in_explainer >= 14, f"Expected 14 pillars in SoulExplainerVideo, found {pillars_in_explainer}"
        
        # Read PetSoulJourney.jsx
        with open('/app/frontend/src/components/PetSoulJourney.jsx', 'r') as f:
            content = f.read()
        
        # Count pillar definitions
        pillars_in_journey = content.count("{ key: '")
        assert pillars_in_journey >= 14, f"Expected 14 pillars in PetSoulJourney, found {pillars_in_journey}"
        
        print(f"✓ 14 Soul Pillars verified in both components")
        print(f"  - SoulExplainerVideo.jsx: {pillars_in_explainer} pillars")
        print(f"  - PetSoulJourney.jsx: {pillars_in_journey} pillars")
    
    def test_pillar_names(self):
        """Verify all 14 pillar names are present"""
        expected_pillars = [
            'Celebrate', 'Dine', 'Stay', 'Travel', 'Care', 'Enjoy', 'Fit',
            'Learn', 'Paperwork', 'Advisory', 'Emergency', 'Farewell', 'Adopt', 'Shop'
        ]
        
        with open('/app/frontend/src/components/SoulExplainerVideo.jsx', 'r') as f:
            content = f.read()
        
        for pillar in expected_pillars:
            assert pillar in content, f"Pillar '{pillar}' not found in SoulExplainerVideo.jsx"
        
        print(f"✓ All 14 pillar names verified: {', '.join(expected_pillars)}")


class TestServiceDeskAnalytics:
    """Test Service Desk Analytics section in DoggyServiceDesk.jsx"""
    
    def test_analytics_section_exists(self):
        """Verify Analytics section is defined in DoggyServiceDesk.jsx"""
        with open('/app/frontend/src/components/admin/DoggyServiceDesk.jsx', 'r') as f:
            content = f.read()
        
        # Check for Analytics section
        assert "activeNav === 'analytics'" in content, "Analytics nav condition not found"
        assert "Analytics & Reports" in content, "Analytics title not found"
        assert "Total Tickets" in content, "Total Tickets metric not found"
        assert "Open Tickets" in content, "Open Tickets metric not found"
        assert "Resolved Tickets" in content, "Resolved Tickets metric not found"
        assert "Avg Resolution Time" in content, "Avg Resolution Time metric not found"
        assert "Tickets by Pillar" in content, "Tickets by Pillar chart not found"
        assert "Tickets by Priority" in content, "Tickets by Priority chart not found"
        assert "Tickets by Channel" in content, "Tickets by Channel chart not found"
        assert "Resolution Rate" in content, "Resolution Rate chart not found"
        assert "SLA Compliance" in content, "SLA Compliance stats not found"
        
        print("✓ Service Desk Analytics section verified with all required components")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
