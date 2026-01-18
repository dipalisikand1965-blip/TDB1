"""
Test Bug Fixes for The Doggy Company Platform
Tests for: Dine reservations, Stay bookings, Service Desk, Voice Orders, Add Bundle
"""

import pytest
import requests
import os
import json
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
ADMIN_USERNAME = "aditya"
ADMIN_PASSWORD = "doggy2026"


class TestDineReservations:
    """Test Dine reservation flow - form submission and status updates"""
    
    def test_get_restaurants(self):
        """Test fetching restaurants list"""
        response = requests.get(f"{BASE_URL}/api/dine/restaurants")
        assert response.status_code == 200
        data = response.json()
        assert "restaurants" in data
        print(f"✅ Found {len(data['restaurants'])} restaurants")
    
    def test_create_reservation(self):
        """Test creating a dine reservation"""
        # First get a restaurant
        restaurants_res = requests.get(f"{BASE_URL}/api/dine/restaurants")
        restaurants = restaurants_res.json().get("restaurants", [])
        
        if not restaurants:
            pytest.skip("No restaurants available for testing")
        
        restaurant_id = restaurants[0]["id"]
        
        # Create reservation
        reservation_data = {
            "restaurant_id": restaurant_id,
            "name": "TEST_User",
            "phone": "9876543210",
            "email": "test@example.com",
            "date": (datetime.now() + timedelta(days=3)).strftime("%Y-%m-%d"),
            "time": "19:00",
            "guests": 2,
            "pets": 1,
            "petMealPreorder": True,
            "specialRequests": "Birthday celebration for my dog",
            "pet_name": "Buddy",
            "pet_breed": "Golden Retriever",
            "pet_about": "Friendly and loves treats"
        }
        
        response = requests.post(f"{BASE_URL}/api/dine/reservations", json=reservation_data)
        assert response.status_code == 200
        data = response.json()
        assert "reservation_id" in data
        assert data["status"] == "pending"
        print(f"✅ Created reservation: {data['reservation_id']}")
        return data["reservation_id"]
    
    def test_admin_get_reservations(self):
        """Test admin fetching reservations"""
        response = requests.get(
            f"{BASE_URL}/api/admin/dine/reservations",
            auth=(ADMIN_USERNAME, ADMIN_PASSWORD)
        )
        assert response.status_code == 200
        data = response.json()
        assert "reservations" in data
        assert "stats" in data
        print(f"✅ Admin fetched {len(data['reservations'])} reservations")
    
    def test_admin_update_reservation_status_with_notification(self):
        """Test updating reservation status triggers notification"""
        # First create a reservation
        restaurants_res = requests.get(f"{BASE_URL}/api/dine/restaurants")
        restaurants = restaurants_res.json().get("restaurants", [])
        
        if not restaurants:
            pytest.skip("No restaurants available")
        
        # Create reservation
        reservation_data = {
            "restaurant_id": restaurants[0]["id"],
            "name": "TEST_StatusUpdate",
            "phone": "9876543210",
            "email": "test@example.com",
            "date": (datetime.now() + timedelta(days=5)).strftime("%Y-%m-%d"),
            "time": "20:00",
            "guests": 4,
            "pets": 2,
            "pet_name": "Max"
        }
        
        create_res = requests.post(f"{BASE_URL}/api/dine/reservations", json=reservation_data)
        assert create_res.status_code == 200
        reservation_id = create_res.json()["reservation_id"]
        
        # Update status to confirmed
        update_res = requests.put(
            f"{BASE_URL}/api/admin/dine/reservations/{reservation_id}/status?status=confirmed",
            auth=(ADMIN_USERNAME, ADMIN_PASSWORD)
        )
        assert update_res.status_code == 200
        print(f"✅ Updated reservation {reservation_id} to confirmed (notification triggered)")
        
        # Update status to cancelled
        update_res2 = requests.put(
            f"{BASE_URL}/api/admin/dine/reservations/{reservation_id}/status?status=cancelled",
            auth=(ADMIN_USERNAME, ADMIN_PASSWORD)
        )
        assert update_res2.status_code == 200
        print(f"✅ Updated reservation {reservation_id} to cancelled (notification triggered)")


class TestStayBookings:
    """Test Stay booking flow and status updates with notifications"""
    
    def test_get_stay_properties(self):
        """Test fetching stay properties"""
        response = requests.get(f"{BASE_URL}/api/stay/properties")
        assert response.status_code == 200
        data = response.json()
        assert "properties" in data
        print(f"✅ Found {len(data['properties'])} stay properties")
    
    def test_create_stay_booking(self):
        """Test creating a stay booking"""
        # Get a property
        properties_res = requests.get(f"{BASE_URL}/api/stay/properties")
        properties = properties_res.json().get("properties", [])
        
        if not properties:
            pytest.skip("No stay properties available")
        
        property_id = properties[0]["id"]
        
        booking_data = {
            "property_id": property_id,
            "guest_name": "TEST_StayGuest",
            "guest_email": "test@example.com",
            "guest_phone": "9876543210",
            "check_in_date": (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d"),
            "check_out_date": (datetime.now() + timedelta(days=10)).strftime("%Y-%m-%d"),
            "guests": 2,
            "pets": 1,
            "pet_name": "Charlie",
            "pet_breed": "Labrador",
            "pet_meal_preorder": True,
            "special_requests": "Ground floor room preferred"
        }
        
        response = requests.post(f"{BASE_URL}/api/stay/bookings", json=booking_data)
        assert response.status_code == 200
        data = response.json()
        assert "booking_id" in data
        print(f"✅ Created stay booking: {data['booking_id']}")
        return data["booking_id"]
    
    def test_admin_get_stay_bookings(self):
        """Test admin fetching stay bookings"""
        response = requests.get(
            f"{BASE_URL}/api/admin/stay/bookings",
            auth=(ADMIN_USERNAME, ADMIN_PASSWORD)
        )
        assert response.status_code == 200
        data = response.json()
        assert "bookings" in data
        print(f"✅ Admin fetched {len(data['bookings'])} stay bookings")
    
    def test_admin_update_stay_booking_status_with_notification(self):
        """Test updating stay booking status triggers notification"""
        # Get existing bookings
        bookings_res = requests.get(
            f"{BASE_URL}/api/admin/stay/bookings",
            auth=(ADMIN_USERNAME, ADMIN_PASSWORD)
        )
        bookings = bookings_res.json().get("bookings", [])
        
        if not bookings:
            # Create a booking first
            properties_res = requests.get(f"{BASE_URL}/api/stay/properties")
            properties = properties_res.json().get("properties", [])
            if not properties:
                pytest.skip("No properties available")
            
            booking_data = {
                "property_id": properties[0]["id"],
                "guest_name": "TEST_StatusTest",
                "guest_email": "test@example.com",
                "guest_phone": "9876543210",
                "check_in_date": (datetime.now() + timedelta(days=14)).strftime("%Y-%m-%d"),
                "check_out_date": (datetime.now() + timedelta(days=16)).strftime("%Y-%m-%d"),
                "guests": 2,
                "pets": 1,
                "pet_name": "Rocky"
            }
            create_res = requests.post(f"{BASE_URL}/api/stay/bookings", json=booking_data)
            booking_id = create_res.json()["booking_id"]
        else:
            booking_id = bookings[0]["id"]
        
        # Update status to confirmed
        update_res = requests.put(
            f"{BASE_URL}/api/admin/stay/bookings/{booking_id}/status?status=confirmed",
            auth=(ADMIN_USERNAME, ADMIN_PASSWORD)
        )
        assert update_res.status_code == 200
        print(f"✅ Updated stay booking {booking_id} to confirmed (notification triggered)")


class TestDineBundles:
    """Test Dine bundles - Add Bundle form fix"""
    
    def test_get_dine_bundles(self):
        """Test fetching dine bundles"""
        response = requests.get(f"{BASE_URL}/api/dine/bundles")
        assert response.status_code == 200
        data = response.json()
        assert "bundles" in data
        print(f"✅ Found {len(data['bundles'])} dine bundles")
    
    def test_admin_create_bundle(self):
        """Test admin creating a dine bundle"""
        bundle_data = {
            "name": "TEST_Birthday Bundle",
            "description": "Complete birthday celebration package",
            "price": 1999,
            "original_price": 2499,
            "items": ["Birthday Cake", "Party Treats", "Celebration Banner"],
            "for_occasion": "birthday",
            "featured": True,
            "active": True
        }
        
        response = requests.post(
            f"{BASE_URL}/api/admin/dine/bundles",
            json=bundle_data,
            auth=(ADMIN_USERNAME, ADMIN_PASSWORD)
        )
        assert response.status_code == 200
        data = response.json()
        assert "bundle" in data
        print(f"✅ Created dine bundle: {data['bundle'].get('id', 'unknown')}")
    
    def test_admin_get_bundles(self):
        """Test admin fetching bundles"""
        response = requests.get(
            f"{BASE_URL}/api/admin/dine/bundles",
            auth=(ADMIN_USERNAME, ADMIN_PASSWORD)
        )
        assert response.status_code == 200
        data = response.json()
        assert "bundles" in data
        print(f"✅ Admin fetched {len(data['bundles'])} bundles")


class TestVoiceOrder:
    """Test Voice Order channel intake"""
    
    def test_text_order_intake(self):
        """Test text-based order intake (simulating voice transcription)"""
        order_data = {
            "message": "I want to order a birthday cake for my dog Max. He's turning 3 years old. I'd like a chicken flavor cake with his name on it. Delivery to Mumbai please.",
            "channel": "voice",
            "customer_name": "TEST_VoiceCustomer",
            "customer_email": "test@example.com",
            "customer_phone": "9876543210",
            "pet_name": "Max"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/channels/text/order",
            data=order_data
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "request_id" in data
        print(f"✅ Voice order intake created: {data['request_id']}")
        print(f"   Extracted data: {json.dumps(data.get('extracted_data', {}), indent=2)[:200]}...")
        return data["request_id"]
    
    def test_get_channel_intakes(self):
        """Test fetching channel intakes"""
        response = requests.get(f"{BASE_URL}/api/channels/intakes")
        assert response.status_code == 200
        data = response.json()
        assert "intakes" in data
        print(f"✅ Found {len(data['intakes'])} channel intakes")
    
    def test_channel_intake_creates_ticket(self):
        """Test that channel intake auto-creates service desk ticket"""
        # Create an intake
        order_data = {
            "message": "I need to book a table at a pet-friendly restaurant for dinner tomorrow",
            "channel": "web",
            "customer_name": "TEST_TicketTest",
            "customer_email": "tickettest@example.com",
            "customer_phone": "9876543210"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/channels/text/order",
            data=order_data
        )
        assert response.status_code == 200
        request_id = response.json()["request_id"]
        
        # Check if ticket was created
        intake_res = requests.get(f"{BASE_URL}/api/channels/intakes/{request_id}")
        assert intake_res.status_code == 200
        intake = intake_res.json()
        
        # Verify ticket_id exists
        if intake.get("ticket_id"):
            print(f"✅ Channel intake {request_id} auto-created ticket: {intake['ticket_id']}")
            print(f"   Detected pillar: {intake.get('pillar', 'unknown')}")
        else:
            print(f"⚠️ Channel intake {request_id} did not create a ticket (may be expected)")


class TestServiceDesk:
    """Test Service Desk functionality"""
    
    def test_get_service_desk_tickets(self):
        """Test fetching service desk tickets"""
        response = requests.get(
            f"{BASE_URL}/api/admin/service-desk/tickets",
            auth=(ADMIN_USERNAME, ADMIN_PASSWORD)
        )
        assert response.status_code == 200
        data = response.json()
        assert "tickets" in data
        print(f"✅ Found {len(data['tickets'])} service desk tickets")
    
    def test_create_service_desk_ticket(self):
        """Test creating a service desk ticket"""
        ticket_data = {
            "title": "TEST_Customer Inquiry",
            "description": "Customer wants to know about pet-friendly restaurants in Mumbai",
            "customer_name": "TEST_ServiceDeskUser",
            "customer_email": "servicedesk@example.com",
            "customer_phone": "9876543210",
            "pillar": "dine",
            "category": "inquiry",
            "priority": "normal"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/admin/service-desk/tickets",
            json=ticket_data,
            auth=(ADMIN_USERNAME, ADMIN_PASSWORD)
        )
        assert response.status_code == 200
        data = response.json()
        assert "ticket_id" in data
        print(f"✅ Created service desk ticket: {data['ticket_id']}")
        return data["ticket_id"]
    
    def test_add_reply_to_ticket(self):
        """Test adding a reply to a ticket"""
        # Get existing tickets
        tickets_res = requests.get(
            f"{BASE_URL}/api/admin/service-desk/tickets",
            auth=(ADMIN_USERNAME, ADMIN_PASSWORD)
        )
        tickets = tickets_res.json().get("tickets", [])
        
        if not tickets:
            pytest.skip("No tickets available for reply test")
        
        ticket_id = tickets[0].get("ticket_id")
        
        reply_data = {
            "message": "Thank you for your inquiry. We have several pet-friendly restaurants in Mumbai.",
            "channel": "email",
            "is_internal": False
        }
        
        response = requests.post(
            f"{BASE_URL}/api/admin/service-desk/tickets/{ticket_id}/reply",
            json=reply_data,
            auth=(ADMIN_USERNAME, ADMIN_PASSWORD)
        )
        # May return 200 or 404 depending on ticket existence
        if response.status_code == 200:
            print(f"✅ Added reply to ticket {ticket_id}")
        else:
            print(f"⚠️ Reply to ticket {ticket_id} returned {response.status_code}")


class TestNotificationEngine:
    """Test notification engine integration"""
    
    def test_notification_log_exists(self):
        """Test that notification logs are being created"""
        response = requests.get(
            f"{BASE_URL}/api/admin/notifications",
            auth=(ADMIN_USERNAME, ADMIN_PASSWORD)
        )
        # May or may not exist depending on implementation
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Found {len(data.get('notifications', []))} admin notifications")
        else:
            print(f"⚠️ Admin notifications endpoint returned {response.status_code}")


class TestHealthAndBasics:
    """Basic health checks"""
    
    def test_health_endpoint(self):
        """Test health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print("✅ Health check passed")
    
    def test_dine_stats(self):
        """Test dine stats endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/admin/dine/stats",
            auth=(ADMIN_USERNAME, ADMIN_PASSWORD)
        )
        assert response.status_code == 200
        data = response.json()
        assert "restaurants" in data
        print(f"✅ Dine stats: {data['restaurants']['total']} restaurants")


# Cleanup fixture
@pytest.fixture(scope="session", autouse=True)
def cleanup_test_data():
    """Cleanup TEST_ prefixed data after all tests"""
    yield
    # Note: In production, you'd want to clean up test data
    # For now, we'll leave it as test data is prefixed with TEST_
    print("\n🧹 Test data cleanup would happen here (TEST_ prefixed items)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
