"""
Stay Pillar API Tests
Tests for The Doggy Company Stay feature - Pet-friendly hotel booking platform

Features tested:
- Public Stay API endpoints (properties listing, filtering, booking requests)
- Admin Stay API endpoints (CRUD operations, status changes, bookings management)
- Paw Rating System
- Property seeding
"""

import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://pet-dashboard-6.preview.emergentagent.com')
ADMIN_USERNAME = "aditya"
ADMIN_PASSWORD = "doggy2026"


class TestStayPublicAPI:
    """Public Stay API endpoint tests"""
    
    def test_get_properties_returns_list(self):
        """Test that /api/stay/properties returns a list of properties"""
        response = requests.get(f"{BASE_URL}/api/stay/properties")
        assert response.status_code == 200
        
        data = response.json()
        assert "properties" in data
        assert "total" in data
        assert "cities" in data
        assert isinstance(data["properties"], list)
        print(f"✓ Found {len(data['properties'])} properties, total: {data['total']}")
    
    def test_properties_have_required_fields(self):
        """Test that properties have all required fields"""
        response = requests.get(f"{BASE_URL}/api/stay/properties")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data["properties"]) > 0, "No properties found"
        
        property = data["properties"][0]
        required_fields = ["id", "name", "city", "property_type", "paw_rating", "pet_policy", "status"]
        
        for field in required_fields:
            assert field in property, f"Missing field: {field}"
        
        # Check paw_rating structure
        assert "overall" in property["paw_rating"]
        assert "comfort" in property["paw_rating"]
        assert "safety" in property["paw_rating"]
        assert "freedom" in property["paw_rating"]
        assert "care" in property["paw_rating"]
        assert "joy" in property["paw_rating"]
        
        print(f"✓ Property '{property['name']}' has all required fields")
    
    def test_properties_count_is_32(self):
        """Test that 32 seeded properties exist"""
        response = requests.get(f"{BASE_URL}/api/stay/properties")
        assert response.status_code == 200
        
        data = response.json()
        # Should have 32 seeded properties
        assert data["total"] >= 32, f"Expected at least 32 properties, got {data['total']}"
        print(f"✓ Found {data['total']} properties (expected >= 32)")
    
    def test_filter_by_city(self):
        """Test filtering properties by city"""
        response = requests.get(f"{BASE_URL}/api/stay/properties?city=Goa")
        assert response.status_code == 200
        
        data = response.json()
        for prop in data["properties"]:
            assert "goa" in prop["city"].lower(), f"Property {prop['name']} is not in Goa"
        
        print(f"✓ City filter works - found {len(data['properties'])} properties in Goa")
    
    def test_filter_by_property_type(self):
        """Test filtering properties by type"""
        response = requests.get(f"{BASE_URL}/api/stay/properties?property_type=resort")
        assert response.status_code == 200
        
        data = response.json()
        for prop in data["properties"]:
            assert prop["property_type"] == "resort", f"Property {prop['name']} is not a resort"
        
        print(f"✓ Property type filter works - found {len(data['properties'])} resorts")
    
    def test_filter_by_min_rating(self):
        """Test filtering properties by minimum paw rating"""
        response = requests.get(f"{BASE_URL}/api/stay/properties?min_rating=4.5")
        assert response.status_code == 200
        
        data = response.json()
        for prop in data["properties"]:
            assert prop["paw_rating"]["overall"] >= 4.5, f"Property {prop['name']} rating is below 4.5"
        
        print(f"✓ Min rating filter works - found {len(data['properties'])} properties with 4.5+ rating")
    
    def test_get_single_property(self):
        """Test getting a single property by ID"""
        # First get a property ID
        list_response = requests.get(f"{BASE_URL}/api/stay/properties")
        assert list_response.status_code == 200
        
        properties = list_response.json()["properties"]
        assert len(properties) > 0
        
        property_id = properties[0]["id"]
        
        # Get single property
        response = requests.get(f"{BASE_URL}/api/stay/properties/{property_id}")
        assert response.status_code == 200
        
        property = response.json()
        assert property["id"] == property_id
        print(f"✓ Single property endpoint works - got '{property['name']}'")
    
    def test_get_nonexistent_property_returns_404(self):
        """Test that getting a non-existent property returns 404"""
        response = requests.get(f"{BASE_URL}/api/stay/properties/nonexistent-id-12345")
        assert response.status_code == 404
        print("✓ Non-existent property returns 404")
    
    def test_cities_list_populated(self):
        """Test that cities list is populated"""
        response = requests.get(f"{BASE_URL}/api/stay/properties")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data["cities"]) > 0, "Cities list is empty"
        print(f"✓ Cities list has {len(data['cities'])} cities: {data['cities'][:5]}...")


class TestStayBookingRequest:
    """Booking request tests"""
    
    def test_create_booking_request(self):
        """Test creating a booking request"""
        # First get a property ID
        list_response = requests.get(f"{BASE_URL}/api/stay/properties")
        assert list_response.status_code == 200
        
        properties = list_response.json()["properties"]
        assert len(properties) > 0
        
        property_id = properties[0]["id"]
        
        # Create booking request
        booking_data = {
            "property_id": property_id,
            "guest_name": "Test User",
            "guest_email": "test@example.com",
            "guest_phone": "+919876543210",
            "pet_name": "Bruno",
            "pet_breed": "Golden Retriever",
            "pet_weight_kg": 25,
            "check_in_date": (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d"),
            "check_out_date": (datetime.now() + timedelta(days=10)).strftime("%Y-%m-%d"),
            "num_rooms": 1,
            "num_adults": 2,
            "num_pets": 1
        }
        
        response = requests.post(
            f"{BASE_URL}/api/stay/booking-request",
            json=booking_data
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "booking_id" in data
        print(f"✓ Booking request created with ID: {data['booking_id']}")
    
    def test_booking_request_with_invalid_property(self):
        """Test booking request with invalid property ID"""
        booking_data = {
            "property_id": "invalid-property-id",
            "guest_name": "Test User",
            "guest_email": "test@example.com",
            "guest_phone": "+919876543210",
            "pet_name": "Bruno",
            "check_in_date": (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d"),
            "check_out_date": (datetime.now() + timedelta(days=10)).strftime("%Y-%m-%d")
        }
        
        response = requests.post(
            f"{BASE_URL}/api/stay/booking-request",
            json=booking_data
        )
        
        assert response.status_code == 404
        print("✓ Invalid property booking returns 404")


class TestStayAdminAPI:
    """Admin Stay API endpoint tests"""
    
    @pytest.fixture
    def auth(self):
        """Return auth tuple for admin requests"""
        return (ADMIN_USERNAME, ADMIN_PASSWORD)
    
    def test_admin_get_properties(self, auth):
        """Test admin properties endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/admin/stay/properties",
            auth=auth
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "properties" in data
        assert "stats" in data
        assert "cities" in data
        print(f"✓ Admin properties endpoint works - {len(data['properties'])} properties")
    
    def test_admin_get_stats(self, auth):
        """Test admin stats endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/admin/stay/stats",
            auth=auth
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "properties" in data
        assert "bookings" in data
        assert "mismatches" in data
        
        # Check properties stats
        assert "total" in data["properties"]
        assert "live" in data["properties"]
        
        print(f"✓ Admin stats: {data['properties']['total']} total, {data['properties']['live']} live")
    
    def test_admin_get_bookings(self, auth):
        """Test admin bookings endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/admin/stay/bookings",
            auth=auth
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "bookings" in data
        assert "stats" in data
        print(f"✓ Admin bookings endpoint works - {len(data['bookings'])} bookings")
    
    def test_admin_get_mismatch_reports(self, auth):
        """Test admin mismatch reports endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/admin/stay/mismatch-reports",
            auth=auth
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "reports" in data
        assert "stats" in data
        print(f"✓ Admin mismatch reports endpoint works - {len(data['reports'])} reports")
    
    def test_admin_update_property_status(self, auth):
        """Test updating property status"""
        # Get a property
        list_response = requests.get(
            f"{BASE_URL}/api/admin/stay/properties",
            auth=auth
        )
        assert list_response.status_code == 200
        
        properties = list_response.json()["properties"]
        assert len(properties) > 0
        
        property_id = properties[0]["id"]
        original_status = properties[0]["status"]
        
        # Update status to paused
        response = requests.put(
            f"{BASE_URL}/api/admin/stay/properties/{property_id}/status?status=paused",
            auth=auth
        )
        assert response.status_code == 200
        
        # Verify status changed
        verify_response = requests.get(
            f"{BASE_URL}/api/admin/stay/properties/{property_id}",
            auth=auth
        )
        assert verify_response.status_code == 200
        assert verify_response.json()["property"]["status"] == "paused"
        
        # Restore original status
        restore_response = requests.put(
            f"{BASE_URL}/api/admin/stay/properties/{property_id}/status?status={original_status}",
            auth=auth
        )
        assert restore_response.status_code == 200
        
        print(f"✓ Property status update works - changed to paused and restored to {original_status}")
    
    def test_admin_invalid_status_returns_400(self, auth):
        """Test that invalid status returns 400"""
        list_response = requests.get(
            f"{BASE_URL}/api/admin/stay/properties",
            auth=auth
        )
        properties = list_response.json()["properties"]
        property_id = properties[0]["id"]
        
        response = requests.put(
            f"{BASE_URL}/api/admin/stay/properties/{property_id}/status?status=invalid_status",
            auth=auth
        )
        assert response.status_code == 400
        print("✓ Invalid status returns 400")
    
    def test_admin_unauthorized_without_credentials(self):
        """Test that admin endpoints require authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/stay/properties")
        assert response.status_code == 401
        print("✓ Admin endpoints require authentication")
    
    def test_admin_unauthorized_with_wrong_credentials(self):
        """Test that wrong credentials are rejected"""
        response = requests.get(
            f"{BASE_URL}/api/admin/stay/properties",
            auth=("wrong", "credentials")
        )
        assert response.status_code == 401
        print("✓ Wrong credentials are rejected")


class TestPawRatingSystem:
    """Paw Rating System tests"""
    
    def test_paw_rating_categories(self):
        """Test that all 5 paw rating categories exist"""
        response = requests.get(f"{BASE_URL}/api/stay/properties")
        assert response.status_code == 200
        
        properties = response.json()["properties"]
        assert len(properties) > 0
        
        property = properties[0]
        paw_rating = property["paw_rating"]
        
        categories = ["comfort", "safety", "freedom", "care", "joy", "overall"]
        for cat in categories:
            assert cat in paw_rating, f"Missing paw rating category: {cat}"
            assert isinstance(paw_rating[cat], (int, float)), f"Invalid type for {cat}"
            assert 0 <= paw_rating[cat] <= 5, f"Rating {cat} out of range: {paw_rating[cat]}"
        
        print(f"✓ All 5 paw rating categories present with valid values")
    
    def test_overall_rating_is_average(self):
        """Test that overall rating is approximately the average of categories"""
        response = requests.get(f"{BASE_URL}/api/stay/properties")
        properties = response.json()["properties"]
        
        for prop in properties[:5]:  # Check first 5 properties
            paw = prop["paw_rating"]
            categories = [paw["comfort"], paw["safety"], paw["freedom"], paw["care"], paw["joy"]]
            valid_scores = [s for s in categories if s > 0]
            
            if valid_scores:
                expected_avg = sum(valid_scores) / len(valid_scores)
                # Allow small floating point difference
                assert abs(paw["overall"] - expected_avg) < 0.2, \
                    f"Overall rating {paw['overall']} doesn't match average {expected_avg}"
        
        print("✓ Overall ratings are correctly calculated averages")


class TestPropertyBadges:
    """Property badges tests"""
    
    def test_properties_have_badges(self):
        """Test that properties have badges array"""
        response = requests.get(f"{BASE_URL}/api/stay/properties")
        properties = response.json()["properties"]
        
        badges_found = set()
        for prop in properties:
            assert "badges" in prop, f"Property {prop['name']} missing badges"
            assert isinstance(prop["badges"], list), f"Badges should be a list"
            badges_found.update(prop["badges"])
        
        print(f"✓ Found badges: {badges_found}")
    
    def test_expected_badges_exist(self):
        """Test that expected badge types exist in the data"""
        response = requests.get(f"{BASE_URL}/api/stay/properties")
        properties = response.json()["properties"]
        
        all_badges = set()
        for prop in properties:
            all_badges.update(prop.get("badges", []))
        
        expected_badges = ["Pet Menu", "Off-leash area", "Pet sitter", "Grooming", "Vet on call", "Trails", "Beach access"]
        found_expected = [b for b in expected_badges if b in all_badges]
        
        assert len(found_expected) >= 5, f"Expected at least 5 badge types, found: {found_expected}"
        print(f"✓ Found expected badges: {found_expected}")


class TestPetPolicy:
    """Pet policy tests"""
    
    def test_pet_policy_structure(self):
        """Test pet policy has required fields"""
        response = requests.get(f"{BASE_URL}/api/stay/properties")
        properties = response.json()["properties"]
        
        for prop in properties[:5]:
            policy = prop.get("pet_policy", {})
            
            # Check key fields exist
            assert "max_pets_per_room" in policy or policy == {}, f"Missing max_pets_per_room in {prop['name']}"
            assert "allowed_in_room" in policy or policy == {}, f"Missing allowed_in_room in {prop['name']}"
        
        print("✓ Pet policies have required structure")
    
    def test_pet_fee_is_numeric(self):
        """Test that pet fees are numeric"""
        response = requests.get(f"{BASE_URL}/api/stay/properties")
        properties = response.json()["properties"]
        
        for prop in properties:
            policy = prop.get("pet_policy", {})
            if "pet_fee_per_night" in policy:
                assert isinstance(policy["pet_fee_per_night"], (int, float)), \
                    f"Pet fee should be numeric in {prop['name']}"
        
        print("✓ Pet fees are numeric values")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
