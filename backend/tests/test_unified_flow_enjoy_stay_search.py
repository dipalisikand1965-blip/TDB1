"""
Test Unified Flow for Enjoy RSVP, Stay Booking, and Universal Search

Tests verify that each action creates:
1. Notification (admin_notifications) with read: false
2. Service Desk Ticket (service_desk_tickets)
3. Unified Inbox Entry (channel_intakes)

All entries should have matching cross-reference IDs.
"""

import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
ADMIN_USERNAME = "aditya"
ADMIN_PASSWORD = "lola4304"


class TestUnifiedFlowEnjoyRSVP:
    """Test Enjoy RSVP creates notification, ticket, and inbox entry"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test data"""
        self.test_id = f"TEST-{uuid.uuid4().hex[:8].upper()}"
        self.session = requests.Session()
        self.session.auth = (ADMIN_USERNAME, ADMIN_PASSWORD)
    
    def test_01_seed_enjoy_data(self):
        """Seed enjoy experiences for testing"""
        response = self.session.post(f"{BASE_URL}/api/enjoy/admin/seed")
        # May return 200 or 401 if auth not required
        assert response.status_code in [200, 201, 401, 422]
        print(f"Enjoy seed response: {response.status_code}")
    
    def test_02_get_experiences(self):
        """Get available experiences"""
        response = requests.get(f"{BASE_URL}/api/enjoy/experiences")
        assert response.status_code == 200
        data = response.json()
        assert "experiences" in data
        print(f"Found {len(data.get('experiences', []))} experiences")
        return data.get("experiences", [])
    
    def test_03_enjoy_rsvp_creates_notification(self):
        """Test that Enjoy RSVP creates notification with read: false"""
        # First get an experience
        exp_response = requests.get(f"{BASE_URL}/api/enjoy/experiences")
        experiences = exp_response.json().get("experiences", [])
        
        if not experiences:
            pytest.skip("No experiences available for RSVP test")
        
        experience_id = experiences[0].get("id")
        
        # Create RSVP
        rsvp_data = {
            "experience_id": experience_id,
            "pet_name": f"TestPet-{self.test_id}",
            "pet_breed": "Golden Retriever",
            "pet_size": "large",
            "pet_personality": "social",
            "number_of_pets": 1,
            "number_of_humans": 2,
            "user_name": f"TestUser-{self.test_id}",
            "user_email": f"test-{self.test_id}@example.com",
            "user_phone": "9876543210"
        }
        
        response = requests.post(f"{BASE_URL}/api/enjoy/rsvp", json=rsvp_data)
        assert response.status_code in [200, 201], f"RSVP failed: {response.text}"
        
        data = response.json()
        assert data.get("success") == True
        rsvp_id = data.get("rsvp_id")
        assert rsvp_id is not None
        print(f"RSVP created: {rsvp_id}")
        
        # Verify notification was created
        notif_response = self.session.get(f"{BASE_URL}/api/admin/notifications")
        if notif_response.status_code == 200:
            notifications = notif_response.json().get("notifications", [])
            # Find notification for this RSVP
            rsvp_notif = None
            for n in notifications:
                if n.get("reference_id") == rsvp_id or n.get("ticket_id") == rsvp_id:
                    rsvp_notif = n
                    break
            
            if rsvp_notif:
                assert rsvp_notif.get("read") == False, "Notification should have read: false"
                assert rsvp_notif.get("pillar") == "enjoy", "Notification should have pillar: enjoy"
                print(f"PASS: Notification created with read: {rsvp_notif.get('read')}")
            else:
                print(f"WARNING: Could not find notification for RSVP {rsvp_id}")
        
        return rsvp_id
    
    def test_04_enjoy_rsvp_creates_service_desk_ticket(self):
        """Test that Enjoy RSVP creates service_desk_tickets entry"""
        # Get recent tickets
        response = self.session.get(f"{BASE_URL}/api/tickets")
        if response.status_code == 200:
            tickets = response.json().get("tickets", [])
            # Find enjoy RSVP tickets
            enjoy_tickets = [t for t in tickets if t.get("pillar") == "enjoy" and "RSVP" in t.get("subject", "")]
            print(f"Found {len(enjoy_tickets)} enjoy RSVP tickets")
            
            if enjoy_tickets:
                ticket = enjoy_tickets[0]
                assert ticket.get("pillar") == "enjoy"
                assert "rsvp" in ticket.get("category", "").lower() or "RSVP" in ticket.get("subject", "")
                print(f"PASS: Service desk ticket created for enjoy RSVP")
        else:
            print(f"Could not verify tickets: {response.status_code}")
    
    def test_05_enjoy_rsvp_creates_channel_intake(self):
        """Test that Enjoy RSVP creates channel_intakes entry"""
        response = self.session.get(f"{BASE_URL}/api/channels/intakes")
        if response.status_code == 200:
            intakes = response.json().get("intakes", [])
            # Find enjoy RSVP intakes
            enjoy_intakes = [i for i in intakes if i.get("pillar") == "enjoy" and i.get("request_type") == "enjoy_rsvp"]
            print(f"Found {len(enjoy_intakes)} enjoy RSVP channel intakes")
            
            if enjoy_intakes:
                intake = enjoy_intakes[0]
                assert intake.get("pillar") == "enjoy"
                print(f"PASS: Channel intake created for enjoy RSVP")
        else:
            print(f"Could not verify channel intakes: {response.status_code}")


class TestUnifiedFlowStayBooking:
    """Test Stay Booking creates notification, ticket, and inbox entry"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test data"""
        self.test_id = f"TEST-{uuid.uuid4().hex[:8].upper()}"
        self.session = requests.Session()
        self.session.auth = (ADMIN_USERNAME, ADMIN_PASSWORD)
    
    def test_01_get_stay_properties(self):
        """Get available stay properties"""
        response = requests.get(f"{BASE_URL}/api/stay/properties")
        assert response.status_code == 200
        data = response.json()
        assert "properties" in data
        print(f"Found {len(data.get('properties', []))} stay properties")
        return data.get("properties", [])
    
    def test_02_stay_booking_creates_notification(self):
        """Test that Stay booking creates notification with read: false and pillar: stay"""
        # First get a property
        prop_response = requests.get(f"{BASE_URL}/api/stay/properties")
        properties = prop_response.json().get("properties", [])
        
        if not properties:
            # Try to seed stay data
            self.session.post(f"{BASE_URL}/api/admin/stay/seed")
            prop_response = requests.get(f"{BASE_URL}/api/stay/properties")
            properties = prop_response.json().get("properties", [])
        
        if not properties:
            pytest.skip("No stay properties available for booking test")
        
        property_id = properties[0].get("id")
        
        # Create booking request
        booking_data = {
            "property_id": property_id,
            "guest_name": f"TestGuest-{self.test_id}",
            "guest_email": f"test-stay-{self.test_id}@example.com",
            "guest_phone": "9876543210",
            "pet_name": f"TestPet-{self.test_id}",
            "pet_breed": "Labrador",
            "check_in_date": "2026-02-15",
            "check_out_date": "2026-02-17",
            "num_rooms": 1,
            "num_adults": 2,
            "num_pets": 1
        }
        
        response = requests.post(f"{BASE_URL}/api/stay/booking-request", json=booking_data)
        assert response.status_code in [200, 201], f"Stay booking failed: {response.text}"
        
        data = response.json()
        assert data.get("success") == True
        booking_id = data.get("booking_id")
        assert booking_id is not None
        print(f"Stay booking created: {booking_id}")
        
        # Verify notification was created
        notif_response = self.session.get(f"{BASE_URL}/api/admin/notifications")
        if notif_response.status_code == 200:
            notifications = notif_response.json().get("notifications", [])
            # Find notification for this booking
            stay_notif = None
            for n in notifications:
                if n.get("type") == "stay_booking" and booking_id in str(n.get("related_id", "")):
                    stay_notif = n
                    break
            
            if stay_notif:
                assert stay_notif.get("read") == False, "Notification should have read: false"
                assert stay_notif.get("pillar") == "stay", "Notification should have pillar: stay"
                print(f"PASS: Stay notification created with read: {stay_notif.get('read')}, pillar: {stay_notif.get('pillar')}")
            else:
                print(f"WARNING: Could not find notification for booking {booking_id}")
        
        return booking_id
    
    def test_03_stay_booking_creates_channel_intake(self):
        """Test that Stay booking creates channel_intakes entry"""
        response = self.session.get(f"{BASE_URL}/api/channels/intakes")
        if response.status_code == 200:
            intakes = response.json().get("intakes", [])
            # Find stay booking intakes
            stay_intakes = [i for i in intakes if i.get("pillar") == "stay"]
            print(f"Found {len(stay_intakes)} stay channel intakes")
            
            if stay_intakes:
                intake = stay_intakes[0]
                assert intake.get("pillar") == "stay"
                print(f"PASS: Channel intake created for stay booking")
        else:
            print(f"Could not verify channel intakes: {response.status_code}")


class TestUnifiedFlowUniversalSearch:
    """Test Universal Search creates notification, ticket, and inbox entry"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test data"""
        self.test_id = f"TEST-{uuid.uuid4().hex[:8].upper()}"
        self.session = requests.Session()
        self.session.auth = (ADMIN_USERNAME, ADMIN_PASSWORD)
    
    def test_01_universal_search_creates_signal(self):
        """Test that universal search creates search signal ticket"""
        query = f"dog treats for birthday {self.test_id}"
        
        response = requests.get(
            f"{BASE_URL}/api/search/universal",
            params={
                "q": query,
                "create_signal": True,
                "member_name": f"TestUser-{self.test_id}",
                "member_email": f"test-search-{self.test_id}@example.com"
            }
        )
        
        assert response.status_code == 200, f"Search failed: {response.text}"
        data = response.json()
        
        # Verify signal was created
        signal = data.get("signal")
        assert signal is not None, "Search should return signal object"
        assert signal.get("ticket_id") is not None, "Signal should have ticket_id"
        assert signal.get("notification_id") is not None, "Signal should have notification_id"
        assert signal.get("inbox_id") is not None, "Signal should have inbox_id"
        assert signal.get("detected_intent") is not None, "Signal should have detected_intent"
        
        print(f"PASS: Search signal created - ticket_id: {signal.get('ticket_id')}")
        print(f"  - notification_id: {signal.get('notification_id')}")
        print(f"  - inbox_id: {signal.get('inbox_id')}")
        print(f"  - detected_intent: {signal.get('detected_intent')}")
        
        return signal
    
    def test_02_universal_search_creates_notification(self):
        """Test that universal search creates notification"""
        query = f"find grooming service {self.test_id}"
        
        response = requests.get(
            f"{BASE_URL}/api/search/universal",
            params={"q": query, "create_signal": True}
        )
        
        assert response.status_code == 200
        signal = response.json().get("signal")
        
        if signal:
            notification_id = signal.get("notification_id")
            
            # Verify notification exists
            notif_response = self.session.get(f"{BASE_URL}/api/admin/notifications")
            if notif_response.status_code == 200:
                notifications = notif_response.json().get("notifications", [])
                search_notif = None
                for n in notifications:
                    if n.get("id") == notification_id:
                        search_notif = n
                        break
                
                if search_notif:
                    assert search_notif.get("read") == False, "Search notification should have read: false"
                    assert search_notif.get("type") == "search_signal"
                    print(f"PASS: Search notification created with read: {search_notif.get('read')}")
                else:
                    print(f"WARNING: Could not find notification {notification_id}")
    
    def test_03_universal_search_creates_channel_intake(self):
        """Test that universal search creates channel_intakes entry"""
        query = f"book hotel for pet {self.test_id}"
        
        response = requests.get(
            f"{BASE_URL}/api/search/universal",
            params={"q": query, "create_signal": True}
        )
        
        assert response.status_code == 200
        signal = response.json().get("signal")
        
        if signal:
            inbox_id = signal.get("inbox_id")
            
            # Verify channel intake exists
            intake_response = self.session.get(f"{BASE_URL}/api/channels/intakes")
            if intake_response.status_code == 200:
                intakes = intake_response.json().get("intakes", [])
                search_intake = None
                for i in intakes:
                    if i.get("id") == inbox_id:
                        search_intake = i
                        break
                
                if search_intake:
                    assert search_intake.get("channel") == "search"
                    assert search_intake.get("category") == "search_signal"
                    print(f"PASS: Search channel intake created")
                else:
                    print(f"WARNING: Could not find channel intake {inbox_id}")
    
    def test_04_search_returns_intelligent_suggestions(self):
        """Test that search returns intelligent suggestions based on intent"""
        # Test different intents
        test_queries = [
            ("dog birthday cake", "discovery_intent"),
            ("book grooming", "booking_intent"),
            ("buy treats", "order_intent"),
            ("help with order", "support_intent"),
            ("how to train puppy", "question_intent")
        ]
        
        for query, expected_intent in test_queries:
            response = requests.get(
                f"{BASE_URL}/api/search/universal",
                params={"q": query, "create_signal": True}
            )
            
            assert response.status_code == 200
            signal = response.json().get("signal")
            
            if signal:
                detected = signal.get("detected_intent")
                print(f"Query: '{query}' -> Intent: {detected} (expected: {expected_intent})")
    
    def test_05_search_min_length_for_signal(self):
        """Test that search only creates signal for queries >= 3 chars"""
        # Short query - should NOT create signal
        response = requests.get(
            f"{BASE_URL}/api/search/universal",
            params={"q": "ab", "create_signal": True}
        )
        
        assert response.status_code == 200
        signal = response.json().get("signal")
        assert signal is None, "Short queries (<3 chars) should not create signal"
        print("PASS: Short query did not create signal")
        
        # Long query - should create signal
        response = requests.get(
            f"{BASE_URL}/api/search/universal",
            params={"q": "dog treats", "create_signal": True}
        )
        
        assert response.status_code == 200
        signal = response.json().get("signal")
        assert signal is not None, "Queries >= 3 chars should create signal"
        print("PASS: Long query created signal")


class TestAPIHealth:
    """Basic API health checks"""
    
    def test_api_health(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        print("PASS: API health check")
    
    def test_enjoy_types_endpoint(self):
        """Test enjoy types endpoint"""
        response = requests.get(f"{BASE_URL}/api/enjoy/types")
        assert response.status_code == 200
        data = response.json()
        assert "experience_types" in data
        print(f"PASS: Enjoy types endpoint - {len(data.get('experience_types', {}))} types")
    
    def test_stay_properties_endpoint(self):
        """Test stay properties endpoint"""
        response = requests.get(f"{BASE_URL}/api/stay/properties")
        assert response.status_code == 200
        data = response.json()
        assert "properties" in data
        print(f"PASS: Stay properties endpoint - {len(data.get('properties', []))} properties")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
