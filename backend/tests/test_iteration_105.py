"""
Iteration 105: Testing New Features
- Service Booking API - POST /api/services/unified-book creates ticket in service desk
- Service Desk has new booking ticket visible
- Service Desk has notification sound toggle button in header
- Care page has Quick Book section with 4 service buttons
- 14 Soul Pillars displayed in SoulExplainerVideo (not 8)
- VAPID public key is in base64 format for push notifications
"""

import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestUnifiedServiceBooking:
    """Test the unified service booking API"""
    
    def test_unified_book_grooming(self):
        """Test creating a grooming booking via unified-book endpoint"""
        booking_data = {
            "service_type": "grooming",
            "sub_service": "full-groom",
            "service_name": "Grooming",
            "sub_service_name": "Full Grooming",
            "pillar": "care",
            "location_type": "home",
            "pet": {
                "name": "TEST_Bruno",
                "breed": "Labrador",
                "age": "3 years",
                "notes": "Friendly, no allergies"
            },
            "customer": {
                "name": "Test Customer",
                "phone": "9876543210",
                "email": "test@example.com"
            },
            "schedule": {
                "preferred_date": "2026-02-15",
                "preferred_time": "10:00 AM",
                "address": "123 Test Street, Bangalore"
            },
            "additional_notes": "Please bring grooming supplies"
        }
        
        response = requests.post(f"{BASE_URL}/api/services/unified-book", json=booking_data)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True
        assert "booking_id" in data
        assert "ticket_id" in data
        assert data["booking_id"].startswith("BK-")
        assert data["ticket_id"].startswith("TKT-")
        print(f"✓ Grooming booking created: {data['booking_id']}, Ticket: {data['ticket_id']}")
        
        return data["ticket_id"]
    
    def test_unified_book_vet(self):
        """Test creating a vet booking via unified-book endpoint"""
        booking_data = {
            "service_type": "vet",
            "sub_service": "general-checkup",
            "service_name": "Vet Consultation",
            "sub_service_name": "General Checkup",
            "pillar": "care",
            "location_type": "salon",
            "pet": {
                "name": "TEST_Max",
                "breed": "Golden Retriever",
                "age": "5 years",
                "notes": "Annual checkup needed"
            },
            "customer": {
                "name": "Test Vet Customer",
                "phone": "9876543211",
                "email": "testvet@example.com"
            },
            "schedule": {
                "preferred_date": "2026-02-16",
                "preferred_time": "02:00 PM",
                "address": "Clinic"
            },
            "additional_notes": "Bring vaccination records"
        }
        
        response = requests.post(f"{BASE_URL}/api/services/unified-book", json=booking_data)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True
        assert "booking_id" in data
        assert "ticket_id" in data
        print(f"✓ Vet booking created: {data['booking_id']}, Ticket: {data['ticket_id']}")
    
    def test_unified_book_training(self):
        """Test creating a training booking via unified-book endpoint"""
        booking_data = {
            "service_type": "training",
            "sub_service": "basic-obedience",
            "service_name": "Training",
            "sub_service_name": "Basic Obedience",
            "pillar": "learn",
            "location_type": "home",
            "pet": {
                "name": "TEST_Buddy",
                "breed": "Beagle",
                "age": "1 year",
                "notes": "Puppy needs basic training"
            },
            "customer": {
                "name": "Test Training Customer",
                "phone": "9876543212",
                "email": "testtraining@example.com"
            },
            "schedule": {
                "preferred_date": "2026-02-17",
                "preferred_time": "11:00 AM",
                "address": "456 Training Lane, Bangalore"
            },
            "additional_notes": "First training session"
        }
        
        response = requests.post(f"{BASE_URL}/api/services/unified-book", json=booking_data)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True
        print(f"✓ Training booking created: {data['booking_id']}, Ticket: {data['ticket_id']}")
    
    def test_unified_book_walking(self):
        """Test creating a walking booking via unified-book endpoint"""
        booking_data = {
            "service_type": "walking",
            "sub_service": "daily-walk",
            "service_name": "Dog Walking",
            "sub_service_name": "Daily Walk",
            "pillar": "care",
            "location_type": "home",
            "pet": {
                "name": "TEST_Charlie",
                "breed": "Poodle",
                "age": "2 years",
                "notes": "Energetic, needs daily walks"
            },
            "customer": {
                "name": "Test Walking Customer",
                "phone": "9876543213",
                "email": "testwalking@example.com"
            },
            "schedule": {
                "preferred_date": "2026-02-18",
                "preferred_time": "06:00 PM",
                "address": "789 Walk Street, Bangalore"
            },
            "additional_notes": "Evening walk preferred"
        }
        
        response = requests.post(f"{BASE_URL}/api/services/unified-book", json=booking_data)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True
        print(f"✓ Walking booking created: {data['booking_id']}, Ticket: {data['ticket_id']}")
    
    def test_unified_book_missing_required_fields(self):
        """Test that missing required fields return validation error"""
        # Missing customer field
        booking_data = {
            "service_type": "grooming",
            "service_name": "Grooming",
            "pillar": "care"
        }
        
        response = requests.post(f"{BASE_URL}/api/services/unified-book", json=booking_data)
        
        # Should return 422 for validation error
        assert response.status_code == 422, f"Expected 422, got {response.status_code}"
        print("✓ Validation error returned for missing required fields")


class TestTicketVisibility:
    """Test that service booking tickets are visible in service desk"""
    
    def test_tickets_endpoint_returns_service_bookings(self):
        """Test that tickets endpoint returns service_booking type tickets"""
        # First create a booking
        booking_data = {
            "service_type": "grooming",
            "sub_service": "bath-brush",
            "service_name": "Grooming",
            "sub_service_name": "Bath & Brush",
            "pillar": "care",
            "location_type": "home",
            "pet": {
                "name": "TEST_Visibility_Dog",
                "breed": "Shih Tzu"
            },
            "customer": {
                "name": "Visibility Test",
                "phone": "9999999999",
                "email": "visibility@test.com"
            },
            "schedule": {
                "preferred_date": "2026-02-20",
                "preferred_time": "09:00 AM",
                "address": "Test Address"
            }
        }
        
        # Create booking
        create_response = requests.post(f"{BASE_URL}/api/services/unified-book", json=booking_data)
        assert create_response.status_code == 200
        ticket_id = create_response.json()["ticket_id"]
        
        # Fetch tickets (admin endpoint)
        tickets_response = requests.get(
            f"{BASE_URL}/api/tickets/",
            auth=("aditya", "lola4304")
        )
        
        assert tickets_response.status_code == 200, f"Expected 200, got {tickets_response.status_code}"
        
        data = tickets_response.json()
        tickets = data.get("tickets", [])
        
        # Find our created ticket
        found_ticket = None
        for ticket in tickets:
            if ticket.get("ticket_id") == ticket_id:
                found_ticket = ticket
                break
        
        assert found_ticket is not None, f"Created ticket {ticket_id} not found in tickets list"
        assert found_ticket.get("type") == "service_booking"
        assert found_ticket.get("category") == "care"
        print(f"✓ Service booking ticket {ticket_id} visible in service desk")


class TestVAPIDKey:
    """Test VAPID public key format"""
    
    def test_vapid_key_is_base64(self):
        """Test that VAPID public key is in proper base64 format"""
        response = requests.get(f"{BASE_URL}/api/push/vapid-public-key")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        vapid_key = data.get("public_key") or data.get("vapid_public_key")
        
        assert vapid_key is not None, f"VAPID public key not returned. Response: {data}"
        
        # VAPID keys should be URL-safe base64 encoded
        # They typically start with 'B' and are ~87 characters
        assert len(vapid_key) >= 80, f"VAPID key too short: {len(vapid_key)} chars"
        assert vapid_key[0] == 'B', f"VAPID key should start with 'B', got '{vapid_key[0]}'"
        
        # Check it's valid base64 URL-safe characters
        import re
        base64_url_pattern = r'^[A-Za-z0-9_-]+$'
        assert re.match(base64_url_pattern, vapid_key), "VAPID key contains invalid base64 characters"
        
        print(f"✓ VAPID key is valid base64 format: {vapid_key[:30]}...")


class TestHealthEndpoints:
    """Basic health check tests"""
    
    def test_api_health(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        print("✓ API health check passed")
    
    def test_db_health(self):
        """Test database health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health/db")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        assert data.get("database") == "connected"
        print(f"✓ Database health check passed - {data.get('products_count', 0)} products")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
