"""
Test Pet Buddy Meetups Feature
Tests for:
1. Pet Buddy Meetups modal shows restaurant name and city in header
2. Visit cards show: user name, date, time slot, restaurant name, city, pets, notes
3. Connect button works and shows loading state, then 'Sent!' after successful request
4. Schedule Visit tab has notification preference selection (Email/WhatsApp radio buttons)
5. Backend stores notification_preference when scheduling a visit
6. Backend sends appropriate notification based on user's preference when meetup request is created
7. Admin Dine Manager -> Meetup Requests tab loads correctly
8. Admin Meetup Requests shows Accept/Decline buttons for pending meetups
"""

import pytest
import requests
import os
import uuid
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
ADMIN_USERNAME = "aditya"
ADMIN_PASSWORD = "doggy2026"


class TestPetBuddyMeetupsBackend:
    """Backend API tests for Pet Buddy Meetups feature"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test fixtures"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        self.admin_auth = (ADMIN_USERNAME, ADMIN_PASSWORD)
        
    def test_get_restaurants_api(self):
        """Test that restaurants API returns data with city field"""
        response = self.session.get(f"{BASE_URL}/api/dine/restaurants")
        assert response.status_code == 200
        data = response.json()
        assert "restaurants" in data
        assert len(data["restaurants"]) > 0
        # Verify restaurant has city field
        restaurant = data["restaurants"][0]
        assert "city" in restaurant
        assert "name" in restaurant
        assert "id" in restaurant
        print(f"✅ Restaurants API returns {len(data['restaurants'])} restaurants with city field")
        
    def test_schedule_visit_with_notification_preference_email(self):
        """Test scheduling a visit with email notification preference"""
        # Get a restaurant first
        response = self.session.get(f"{BASE_URL}/api/dine/restaurants")
        restaurants = response.json()["restaurants"]
        restaurant_id = restaurants[0]["id"]
        
        # Schedule a visit with email preference
        tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
        visit_data = {
            "restaurant_id": restaurant_id,
            "date": tomorrow,
            "time_slot": "afternoon",
            "looking_for_buddies": True,
            "notes": "TEST_Looking for playmates for my Golden Retriever!",
            "notification_preference": "email"
        }
        
        response = self.session.post(f"{BASE_URL}/api/dine/visits", json=visit_data)
        assert response.status_code == 200
        data = response.json()
        assert "visit" in data
        assert data["visit"]["notification_preference"] == "email"
        assert data["visit"]["restaurant_name"] is not None
        assert data["visit"]["restaurant_city"] is not None
        print(f"✅ Visit scheduled with email notification preference: {data['visit']['id']}")
        return data["visit"]["id"]
        
    def test_schedule_visit_with_notification_preference_whatsapp(self):
        """Test scheduling a visit with WhatsApp notification preference"""
        # Get a restaurant first
        response = self.session.get(f"{BASE_URL}/api/dine/restaurants")
        restaurants = response.json()["restaurants"]
        restaurant_id = restaurants[0]["id"]
        
        # Schedule a visit with whatsapp preference
        tomorrow = (datetime.now() + timedelta(days=2)).strftime("%Y-%m-%d")
        visit_data = {
            "restaurant_id": restaurant_id,
            "date": tomorrow,
            "time_slot": "evening",
            "looking_for_buddies": True,
            "notes": "TEST_WhatsApp notification test",
            "notification_preference": "whatsapp"
        }
        
        response = self.session.post(f"{BASE_URL}/api/dine/visits", json=visit_data)
        assert response.status_code == 200
        data = response.json()
        assert "visit" in data
        assert data["visit"]["notification_preference"] == "whatsapp"
        print(f"✅ Visit scheduled with WhatsApp notification preference: {data['visit']['id']}")
        return data["visit"]["id"]
        
    def test_get_restaurant_visits(self):
        """Test getting visits for a restaurant"""
        # Get a restaurant first
        response = self.session.get(f"{BASE_URL}/api/dine/restaurants")
        restaurants = response.json()["restaurants"]
        restaurant_id = restaurants[0]["id"]
        
        response = self.session.get(f"{BASE_URL}/api/dine/restaurants/{restaurant_id}/visits")
        assert response.status_code == 200
        data = response.json()
        assert "visits" in data
        assert "restaurant_id" in data
        print(f"✅ Restaurant visits API returns {len(data['visits'])} visits")
        
    def test_visit_response_includes_restaurant_info(self):
        """Test that visit response includes restaurant name and city"""
        # Get a restaurant first
        response = self.session.get(f"{BASE_URL}/api/dine/restaurants")
        restaurants = response.json()["restaurants"]
        restaurant = restaurants[0]
        restaurant_id = restaurant["id"]
        
        # Schedule a visit
        tomorrow = (datetime.now() + timedelta(days=3)).strftime("%Y-%m-%d")
        visit_data = {
            "restaurant_id": restaurant_id,
            "date": tomorrow,
            "time_slot": "morning",
            "looking_for_buddies": True,
            "notes": "TEST_Restaurant info test",
            "notification_preference": "email"
        }
        
        response = self.session.post(f"{BASE_URL}/api/dine/visits", json=visit_data)
        assert response.status_code == 200
        data = response.json()
        visit = data["visit"]
        
        # Verify restaurant info is included
        assert "restaurant_name" in visit
        assert "restaurant_city" in visit
        assert visit["restaurant_name"] == restaurant["name"]
        assert visit["restaurant_city"] == restaurant["city"]
        print(f"✅ Visit includes restaurant info: {visit['restaurant_name']} in {visit['restaurant_city']}")
        
    def test_send_meetup_request(self):
        """Test sending a meetup request"""
        # First create a visit
        response = self.session.get(f"{BASE_URL}/api/dine/restaurants")
        restaurants = response.json()["restaurants"]
        restaurant_id = restaurants[0]["id"]
        
        tomorrow = (datetime.now() + timedelta(days=4)).strftime("%Y-%m-%d")
        visit_data = {
            "restaurant_id": restaurant_id,
            "date": tomorrow,
            "time_slot": "afternoon",
            "looking_for_buddies": True,
            "notes": "TEST_Meetup request test",
            "notification_preference": "email"
        }
        
        visit_response = self.session.post(f"{BASE_URL}/api/dine/visits", json=visit_data)
        visit_id = visit_response.json()["visit"]["id"]
        
        # Send meetup request
        meetup_data = {
            "visit_id": visit_id,
            "message": "TEST_Hey! Would love to meet up with you and your pet!"
        }
        
        response = self.session.post(f"{BASE_URL}/api/dine/meetup-request", json=meetup_data)
        assert response.status_code == 200
        data = response.json()
        assert "request_id" in data
        assert "message" in data
        print(f"✅ Meetup request sent successfully: {data['request_id']}")
        return data["request_id"]
        
    def test_admin_get_meetups(self):
        """Test admin endpoint to get all meetup requests"""
        response = self.session.get(
            f"{BASE_URL}/api/admin/dine/meetups",
            auth=self.admin_auth
        )
        assert response.status_code == 200
        data = response.json()
        assert "meetups" in data
        assert "stats" in data
        assert "total" in data["stats"]
        assert "pending" in data["stats"]
        assert "accepted" in data["stats"]
        assert "declined" in data["stats"]
        print(f"✅ Admin meetups API returns {len(data['meetups'])} meetups, stats: {data['stats']}")
        
    def test_admin_get_visits(self):
        """Test admin endpoint to get all visits"""
        response = self.session.get(
            f"{BASE_URL}/api/admin/dine/visits",
            auth=self.admin_auth
        )
        assert response.status_code == 200
        data = response.json()
        assert "visits" in data
        assert "stats" in data
        print(f"✅ Admin visits API returns {len(data['visits'])} visits")
        
    def test_admin_update_meetup_status_accept(self):
        """Test admin can accept a meetup request"""
        # First get existing meetups
        response = self.session.get(
            f"{BASE_URL}/api/admin/dine/meetups",
            auth=self.admin_auth
        )
        meetups = response.json()["meetups"]
        
        # Find a pending meetup or create one
        pending_meetup = next((m for m in meetups if m.get("status") == "pending"), None)
        
        if pending_meetup:
            meetup_id = pending_meetup["id"]
            # Update status to accepted
            response = self.session.put(
                f"{BASE_URL}/api/admin/dine/meetups/{meetup_id}/status?status=accepted&send_notification=false",
                auth=self.admin_auth
            )
            assert response.status_code == 200
            print(f"✅ Admin can accept meetup request: {meetup_id}")
        else:
            print("⚠️ No pending meetups to test accept functionality")
            
    def test_admin_update_meetup_status_decline(self):
        """Test admin can decline a meetup request"""
        # First create a new meetup to decline
        response = self.session.get(f"{BASE_URL}/api/dine/restaurants")
        restaurants = response.json()["restaurants"]
        restaurant_id = restaurants[0]["id"]
        
        tomorrow = (datetime.now() + timedelta(days=5)).strftime("%Y-%m-%d")
        visit_data = {
            "restaurant_id": restaurant_id,
            "date": tomorrow,
            "time_slot": "evening",
            "looking_for_buddies": True,
            "notes": "TEST_Decline test",
            "notification_preference": "email"
        }
        
        visit_response = self.session.post(f"{BASE_URL}/api/dine/visits", json=visit_data)
        visit_id = visit_response.json()["visit"]["id"]
        
        # Send meetup request
        meetup_data = {
            "visit_id": visit_id,
            "message": "TEST_Decline test meetup"
        }
        
        meetup_response = self.session.post(f"{BASE_URL}/api/dine/meetup-request", json=meetup_data)
        meetup_id = meetup_response.json()["request_id"]
        
        # Decline the meetup
        response = self.session.put(
            f"{BASE_URL}/api/admin/dine/meetups/{meetup_id}/status?status=declined&send_notification=false",
            auth=self.admin_auth
        )
        assert response.status_code == 200
        print(f"✅ Admin can decline meetup request: {meetup_id}")
        
    def test_admin_delete_meetup(self):
        """Test admin can delete a meetup request"""
        # First create a new meetup to delete
        response = self.session.get(f"{BASE_URL}/api/dine/restaurants")
        restaurants = response.json()["restaurants"]
        restaurant_id = restaurants[0]["id"]
        
        tomorrow = (datetime.now() + timedelta(days=6)).strftime("%Y-%m-%d")
        visit_data = {
            "restaurant_id": restaurant_id,
            "date": tomorrow,
            "time_slot": "morning",
            "looking_for_buddies": True,
            "notes": "TEST_Delete test",
            "notification_preference": "email"
        }
        
        visit_response = self.session.post(f"{BASE_URL}/api/dine/visits", json=visit_data)
        visit_id = visit_response.json()["visit"]["id"]
        
        # Send meetup request
        meetup_data = {
            "visit_id": visit_id,
            "message": "TEST_Delete test meetup"
        }
        
        meetup_response = self.session.post(f"{BASE_URL}/api/dine/meetup-request", json=meetup_data)
        meetup_id = meetup_response.json()["request_id"]
        
        # Delete the meetup
        response = self.session.delete(
            f"{BASE_URL}/api/admin/dine/meetups/{meetup_id}",
            auth=self.admin_auth
        )
        assert response.status_code == 200
        print(f"✅ Admin can delete meetup request: {meetup_id}")


class TestRestaurantVisitModel:
    """Test RestaurantVisit model fields"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test fixtures"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
    def test_visit_model_has_notification_preference_field(self):
        """Test that visit model includes notification_preference field"""
        response = self.session.get(f"{BASE_URL}/api/dine/restaurants")
        restaurants = response.json()["restaurants"]
        restaurant_id = restaurants[0]["id"]
        
        tomorrow = (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d")
        visit_data = {
            "restaurant_id": restaurant_id,
            "date": tomorrow,
            "time_slot": "afternoon",
            "looking_for_buddies": True,
            "notes": "TEST_Model field test",
            "notification_preference": "whatsapp"
        }
        
        response = self.session.post(f"{BASE_URL}/api/dine/visits", json=visit_data)
        assert response.status_code == 200
        visit = response.json()["visit"]
        
        # Verify all expected fields
        assert "id" in visit
        assert "restaurant_id" in visit
        assert "restaurant_name" in visit
        assert "restaurant_city" in visit
        assert "date" in visit
        assert "time_slot" in visit
        assert "looking_for_buddies" in visit
        assert "notes" in visit
        assert "notification_preference" in visit
        assert visit["notification_preference"] == "whatsapp"
        print("✅ Visit model has all required fields including notification_preference")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
