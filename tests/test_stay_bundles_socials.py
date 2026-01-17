"""
Test Stay Bundles, Socials, and Review APIs
Tests for Stay Pillar features including:
- Stay Products/Bundles API
- Stay Socials/Events API
- Review submission API
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestStayBundlesAPI:
    """Tests for Stay Products/Bundles API"""
    
    def test_get_bundles_returns_data(self):
        """Test GET /api/stay/products/bundles returns bundles"""
        response = requests.get(f"{BASE_URL}/api/stay/products/bundles")
        assert response.status_code == 200
        
        data = response.json()
        assert "bundles" in data
        assert "total" in data
        assert "categories" in data
        assert "trip_types" in data
        
        # Verify we have 8 bundles as expected
        assert len(data["bundles"]) == 8
        assert data["total"] == 8
        
    def test_bundles_have_required_fields(self):
        """Test that bundles have all required fields"""
        response = requests.get(f"{BASE_URL}/api/stay/products/bundles")
        assert response.status_code == 200
        
        data = response.json()
        bundles = data["bundles"]
        
        required_fields = ["id", "name", "description", "category", "items", 
                          "bundle_price", "original_price", "discount_percent"]
        
        for bundle in bundles:
            for field in required_fields:
                assert field in bundle, f"Bundle missing field: {field}"
            
            # Verify price is valid
            assert bundle["bundle_price"] > 0
            assert bundle["original_price"] >= bundle["bundle_price"]
            
    def test_bundles_filter_by_category(self):
        """Test filtering bundles by category"""
        response = requests.get(f"{BASE_URL}/api/stay/products/bundles?category=travel_kit")
        assert response.status_code == 200
        
        data = response.json()
        for bundle in data["bundles"]:
            assert bundle["category"] == "travel_kit"
            
    def test_bundles_filter_by_featured(self):
        """Test filtering bundles by featured status"""
        response = requests.get(f"{BASE_URL}/api/stay/products/bundles?featured=true")
        assert response.status_code == 200
        
        data = response.json()
        for bundle in data["bundles"]:
            assert bundle["featured"] == True


class TestStaySocialsAPI:
    """Tests for Stay Socials/Events API"""
    
    def test_get_socials_returns_data(self):
        """Test GET /api/stay/social/events returns events"""
        response = requests.get(f"{BASE_URL}/api/stay/social/events")
        assert response.status_code == 200
        
        data = response.json()
        assert "events" in data
        assert "total" in data
        
        # Verify we have 3 events as expected
        assert len(data["events"]) == 3
        assert data["total"] == 3
        
    def test_socials_have_required_fields(self):
        """Test that social events have all required fields"""
        response = requests.get(f"{BASE_URL}/api/stay/social/events")
        assert response.status_code == 200
        
        data = response.json()
        events = data["events"]
        
        required_fields = ["id", "title", "description", "event_type", 
                          "event_date", "event_time", "max_participants",
                          "property_id", "property_name"]
        
        for event in events:
            for field in required_fields:
                assert field in event, f"Event missing field: {field}"
                
    def test_socials_have_property_info(self):
        """Test that social events are enriched with property info"""
        response = requests.get(f"{BASE_URL}/api/stay/social/events")
        assert response.status_code == 200
        
        data = response.json()
        for event in data["events"]:
            assert "property_name" in event
            assert "property_city" in event
            assert event["property_name"] is not None


class TestStayPropertiesAPI:
    """Tests for Stay Properties API"""
    
    def test_get_properties_returns_data(self):
        """Test GET /api/stay/properties returns properties"""
        response = requests.get(f"{BASE_URL}/api/stay/properties")
        assert response.status_code == 200
        
        data = response.json()
        assert "properties" in data
        assert "cities" in data
        
        # Verify we have 32 properties as expected
        assert len(data["properties"]) == 32
        
    def test_properties_have_paw_rating(self):
        """Test that properties have paw rating"""
        response = requests.get(f"{BASE_URL}/api/stay/properties")
        assert response.status_code == 200
        
        data = response.json()
        for prop in data["properties"]:
            assert "paw_rating" in prop
            paw_rating = prop["paw_rating"]
            assert "overall" in paw_rating
            assert "comfort" in paw_rating
            assert "safety" in paw_rating
            
    def test_properties_filter_by_city(self):
        """Test filtering properties by city"""
        response = requests.get(f"{BASE_URL}/api/stay/properties?city=Goa")
        assert response.status_code == 200
        
        data = response.json()
        for prop in data["properties"]:
            assert prop["city"] == "Goa"


class TestReviewsAPI:
    """Tests for Review submission API"""
    
    def test_submit_review_success(self):
        """Test POST /api/reviews creates a review"""
        review_data = {
            "product_id": "test-product-review-123",
            "rating": 5,
            "comment": "Great product for my dog!",
            "reviewer_name": "Test User",
            "reviewer_email": "test@example.com",
            "title": "Excellent!"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/reviews",
            json=review_data
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "message" in data
        assert "review" in data
        assert data["review"]["product_id"] == review_data["product_id"]
        assert data["review"]["rating"] == review_data["rating"]
        assert data["review"]["status"] == "pending"
        
    def test_submit_review_missing_fields(self):
        """Test review submission with missing required fields"""
        review_data = {
            "product_id": "test-product-123"
            # Missing rating and comment
        }
        
        response = requests.post(
            f"{BASE_URL}/api/reviews",
            json=review_data
        )
        # Should fail validation
        assert response.status_code in [400, 422]


class TestHealthEndpoints:
    """Tests for health check endpoints"""
    
    def test_health_check(self):
        """Test /api/health returns healthy status"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "healthy"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
