"""
Test suite for Member Dashboard Dining features
Tests the My Dining tab functionality including reservations, visits, and meetups
"""

import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://filter-fix-phase.preview.emergentagent.com')

# Test user credentials
TEST_EMAIL = "test@example.com"
TEST_PASSWORD = "test123"
TEST_USER_ID = "60894707-82e6-4769-af61-4463b779bec0"


class TestDineAPIs:
    """Test Dine API endpoints for member dashboard"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def test_get_restaurants_public(self):
        """Test public restaurants endpoint"""
        response = self.session.get(f"{BASE_URL}/api/dine/restaurants")
        assert response.status_code == 200
        data = response.json()
        assert "restaurants" in data
        assert isinstance(data["restaurants"], list)
        print(f"Found {len(data['restaurants'])} restaurants")
    
    def test_get_featured_restaurants(self):
        """Test featured restaurants filter"""
        response = self.session.get(f"{BASE_URL}/api/dine/restaurants?featured=true")
        assert response.status_code == 200
        data = response.json()
        assert "restaurants" in data
        # All returned restaurants should be featured
        for restaurant in data["restaurants"]:
            assert restaurant.get("featured") == True
        print(f"Found {len(data['restaurants'])} featured restaurants")
    
    def test_get_restaurant_by_id(self):
        """Test getting a specific restaurant"""
        # First get list to find a valid ID
        list_response = self.session.get(f"{BASE_URL}/api/dine/restaurants")
        restaurants = list_response.json()["restaurants"]
        if restaurants:
            restaurant_id = restaurants[0]["id"]
            response = self.session.get(f"{BASE_URL}/api/dine/restaurants/{restaurant_id}")
            assert response.status_code == 200
            data = response.json()
            assert data["id"] == restaurant_id
            assert "name" in data
            print(f"Retrieved restaurant: {data['name']}")
    
    def test_get_restaurant_not_found(self):
        """Test 404 for non-existent restaurant"""
        response = self.session.get(f"{BASE_URL}/api/dine/restaurants/non-existent-id")
        assert response.status_code == 404
    
    def test_my_reservations_with_email(self):
        """Test getting user reservations by email"""
        response = self.session.get(f"{BASE_URL}/api/dine/my-reservations?email={TEST_EMAIL}")
        assert response.status_code == 200
        data = response.json()
        assert "reservations" in data
        assert "upcoming" in data
        assert "past" in data
        assert "total" in data
        print(f"Found {data['total']} reservations for {TEST_EMAIL}")
    
    def test_my_reservations_requires_param(self):
        """Test that my-reservations requires user_id or email"""
        response = self.session.get(f"{BASE_URL}/api/dine/my-reservations")
        assert response.status_code == 400
    
    def test_my_dining_history_with_both_params(self):
        """Test dining history with both user_id and email (fixed bug)"""
        response = self.session.get(
            f"{BASE_URL}/api/dine/my-dining-history?user_id={TEST_USER_ID}&email={TEST_EMAIL}"
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify structure
        assert "reservations" in data
        assert "visits" in data
        assert "meetups" in data
        
        # Verify reservations structure
        assert "items" in data["reservations"]
        assert "upcoming" in data["reservations"]
        assert "past" in data["reservations"]
        
        # Verify visits structure
        assert "items" in data["visits"]
        assert "upcoming" in data["visits"]
        assert "past" in data["visits"]
        
        # Verify meetups structure
        assert "items" in data["meetups"]
        assert "pending" in data["meetups"]
        assert "accepted" in data["meetups"]
        
        print(f"Dining history: {len(data['reservations']['items'])} reservations, "
              f"{len(data['visits']['items'])} visits, {len(data['meetups']['items'])} meetups")
    
    def test_my_dining_history_requires_param(self):
        """Test that my-dining-history requires user_id or email"""
        response = self.session.get(f"{BASE_URL}/api/dine/my-dining-history")
        assert response.status_code == 400
    
    def test_create_reservation(self):
        """Test creating a new reservation"""
        # Get a restaurant first
        list_response = self.session.get(f"{BASE_URL}/api/dine/restaurants")
        restaurants = list_response.json()["restaurants"]
        assert len(restaurants) > 0, "No restaurants available for testing"
        
        restaurant_id = restaurants[0]["id"]
        
        # Create reservation
        reservation_data = {
            "restaurant_id": restaurant_id,
            "name": "Test Reservation User",
            "phone": "9876543210",
            "email": f"test_res_{datetime.now().timestamp()}@example.com",
            "date": (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d"),
            "time": "7:00 PM",
            "guests": 2,
            "pets": 1,
            "petMealPreorder": False,
            "specialRequests": "Test reservation"
        }
        
        response = self.session.post(f"{BASE_URL}/api/dine/reservations", json=reservation_data)
        assert response.status_code == 200
        data = response.json()
        assert "reservation_id" in data
        assert data["status"] == "pending"
        print(f"Created reservation: {data['reservation_id']}")
    
    def test_create_reservation_invalid_restaurant(self):
        """Test creating reservation with invalid restaurant"""
        reservation_data = {
            "restaurant_id": "invalid-restaurant-id",
            "name": "Test User",
            "phone": "9876543210",
            "email": "test@example.com",
            "date": "2026-01-25",
            "time": "7:00 PM",
            "guests": 2,
            "pets": 1
        }
        
        response = self.session.post(f"{BASE_URL}/api/dine/reservations", json=reservation_data)
        assert response.status_code == 404


class TestDineVisitsAndMeetups:
    """Test Pet Buddy visits and meetup features"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def test_get_restaurant_visits(self):
        """Test getting visits for a restaurant"""
        # Get a restaurant first
        list_response = self.session.get(f"{BASE_URL}/api/dine/restaurants")
        restaurants = list_response.json()["restaurants"]
        if restaurants:
            restaurant_id = restaurants[0]["id"]
            response = self.session.get(f"{BASE_URL}/api/dine/restaurants/{restaurant_id}/visits")
            assert response.status_code == 200
            data = response.json()
            assert "visits" in data
            assert "grouped_by_date" in data
            assert "total_upcoming" in data
    
    def test_get_my_visits(self):
        """Test getting user's visits"""
        response = self.session.get(f"{BASE_URL}/api/dine/my-visits?user_id={TEST_USER_ID}")
        assert response.status_code == 200
        data = response.json()
        assert "visits" in data
    
    def test_get_meetup_requests(self):
        """Test getting meetup requests"""
        response = self.session.get(f"{BASE_URL}/api/dine/meetup-requests?user_id={TEST_USER_ID}")
        assert response.status_code == 200
        data = response.json()
        assert "requests" in data
    
    def test_get_notifications(self):
        """Test getting user notifications"""
        response = self.session.get(f"{BASE_URL}/api/dine/notifications?user_id={TEST_USER_ID}")
        assert response.status_code == 200
        data = response.json()
        assert "notifications" in data
        assert "unread_count" in data


class TestUserAuth:
    """Test user authentication for member dashboard"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def test_login_success(self):
        """Test successful login"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["email"] == TEST_EMAIL
        print(f"Login successful for {TEST_EMAIL}")
    
    def test_login_invalid_credentials(self):
        """Test login with wrong password"""
        response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": "wrongpassword"
        })
        assert response.status_code == 401
    
    def test_auth_me_with_token(self):
        """Test /auth/me endpoint with valid token"""
        # First login to get token
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        token = login_response.json()["access_token"]
        
        # Test /auth/me
        response = self.session.get(f"{BASE_URL}/api/auth/me", headers={
            "Authorization": f"Bearer {token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert "user" in data
        assert data["user"]["email"] == TEST_EMAIL


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
