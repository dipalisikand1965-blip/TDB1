"""
Iteration 146: Service Type Bug Fix Tests
=========================================
Testing the fix for Quick Book confirmation message showing wrong service type.
User reported: 'again this hotel booking' - grooming request showed 'hotel_booking'.

Key fixes being tested:
1. MiraAI.jsx now uses data.service_type from API response for confirmation message
2. Backend /api/mira/quick-book returns service_type in response
3. Word boundary regex matching in detect_concierge_action_needed (grooming != room)
"""

import pytest
import requests
import os
import re

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestServiceTypeBugFix:
    """Tests for the service type bug fix - grooming should not show as hotel_booking"""
    
    def test_api_health(self):
        """Verify API is accessible"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        print("✅ API health check passed")
    
    def test_quick_book_returns_service_type_grooming(self):
        """P0: Quick book endpoint returns correct service_type for grooming"""
        payload = {
            "date": "2026-01-20",
            "time": "10:00",
            "notes": "Full grooming session",
            "serviceType": "grooming",
            "session_id": "test-session-grooming"
        }
        response = requests.post(f"{BASE_URL}/api/mira/quick-book", json=payload)
        assert response.status_code == 200
        data = response.json()
        
        # CRITICAL: service_type must be returned and must be 'grooming'
        assert "service_type" in data, "service_type must be in response"
        assert data["service_type"] == "grooming", f"Expected 'grooming', got '{data.get('service_type')}'"
        assert data.get("success") == True
        assert "booking_id" in data
        print(f"✅ Quick book returns service_type='grooming' correctly. Booking: {data.get('booking_id')}")
    
    def test_quick_book_returns_service_type_vet(self):
        """Quick book endpoint returns correct service_type for vet"""
        payload = {
            "date": "2026-01-21",
            "time": "14:00",
            "notes": "Annual checkup",
            "serviceType": "vet_consultation",
            "session_id": "test-session-vet"
        }
        response = requests.post(f"{BASE_URL}/api/mira/quick-book", json=payload)
        assert response.status_code == 200
        data = response.json()
        
        assert "service_type" in data
        assert data["service_type"] == "vet_consultation"
        print(f"✅ Quick book returns service_type='vet_consultation' correctly")
    
    def test_quick_book_returns_service_type_boarding(self):
        """Quick book endpoint returns correct service_type for boarding"""
        payload = {
            "date": "2026-01-25",
            "time": "09:00",
            "notes": "Weekend boarding",
            "serviceType": "boarding",
            "session_id": "test-session-boarding"
        }
        response = requests.post(f"{BASE_URL}/api/mira/quick-book", json=payload)
        assert response.status_code == 200
        data = response.json()
        
        assert "service_type" in data
        assert data["service_type"] == "boarding"
        print(f"✅ Quick book returns service_type='boarding' correctly")


class TestConciergeActionDetection:
    """Tests for word boundary matching in concierge action detection"""
    
    def test_grooming_message_returns_care_appointment(self):
        """P0: 'grooming' message should return care_appointment, NOT hotel_booking"""
        payload = {
            "message": "I need grooming for my dog",
            "session_id": "test-grooming-detection"
        }
        response = requests.post(f"{BASE_URL}/api/mira/chat", json=payload)
        assert response.status_code == 200
        data = response.json()
        
        # Check concierge_action if present
        concierge_action = data.get("concierge_action", {})
        if concierge_action.get("action_needed"):
            action_type = concierge_action.get("action_type", "")
            service_type = concierge_action.get("service_type", "")
            
            # CRITICAL: Must NOT be hotel_booking
            assert action_type != "hotel_booking", f"grooming should NOT trigger hotel_booking, got: {action_type}"
            
            # Should be care_appointment or grooming-related
            valid_types = ["care_appointment", "care_request", "grooming", "care_confirmed"]
            assert action_type in valid_types or "care" in action_type.lower() or "groom" in action_type.lower(), \
                f"Expected care/grooming action, got: {action_type}"
            
            print(f"✅ Grooming message returns action_type='{action_type}', service_type='{service_type}'")
        else:
            print("ℹ️ No concierge_action detected (may be handled differently)")
    
    def test_room_message_does_not_match_grooming(self):
        """Word boundary test: 'room' should NOT match 'grooming' keyword"""
        payload = {
            "message": "I need a room for my dog",
            "session_id": "test-room-detection"
        }
        response = requests.post(f"{BASE_URL}/api/mira/chat", json=payload)
        assert response.status_code == 200
        data = response.json()
        
        concierge_action = data.get("concierge_action", {})
        if concierge_action.get("action_needed"):
            action_type = concierge_action.get("action_type", "")
            trigger = concierge_action.get("trigger_keyword", "")
            
            # 'room' should trigger hotel_booking (stay), NOT care_appointment (grooming)
            # This tests the word boundary fix
            assert trigger != "grooming", f"'room' should NOT trigger 'grooming' keyword"
            print(f"✅ 'room' message correctly triggers: {action_type} (trigger: {trigger})")
        else:
            print("ℹ️ No concierge_action for 'room' message")
    
    def test_hotel_booking_message(self):
        """Hotel/stay message should return hotel_booking action"""
        payload = {
            "message": "I need a hotel for my dog",
            "session_id": "test-hotel-detection"
        }
        response = requests.post(f"{BASE_URL}/api/mira/chat", json=payload)
        assert response.status_code == 200
        data = response.json()
        
        concierge_action = data.get("concierge_action", {})
        if concierge_action.get("action_needed"):
            action_type = concierge_action.get("action_type", "")
            # Hotel should trigger hotel_booking or stay-related
            valid_types = ["hotel_booking", "stay_request", "stay_confirmed"]
            assert action_type in valid_types or "hotel" in action_type.lower() or "stay" in action_type.lower(), \
                f"Expected hotel/stay action, got: {action_type}"
            print(f"✅ Hotel message returns action_type='{action_type}'")
        else:
            print("ℹ️ No concierge_action for hotel message")


class TestChatAPIServiceType:
    """Tests for chat API returning correct service_type in concierge_action"""
    
    def test_grooming_chat_service_type(self):
        """P0: Chat API should return service_type='grooming' for grooming requests"""
        payload = {
            "message": "book grooming appointment",
            "session_id": "test-chat-grooming-service"
        }
        response = requests.post(f"{BASE_URL}/api/mira/chat", json=payload)
        assert response.status_code == 200
        data = response.json()
        
        concierge_action = data.get("concierge_action", {})
        if concierge_action.get("show_quick_book_form"):
            service_type = concierge_action.get("service_type", "")
            # Service type should be grooming-related
            assert "groom" in service_type.lower() or service_type == "care_appointment", \
                f"Expected grooming service_type, got: {service_type}"
            print(f"✅ Chat API returns service_type='{service_type}' for grooming")
        else:
            print("ℹ️ Quick book form not shown for this message")
    
    def test_vet_chat_service_type(self):
        """Chat API should return correct service_type for vet requests"""
        payload = {
            "message": "I need a vet appointment",
            "session_id": "test-chat-vet-service"
        }
        response = requests.post(f"{BASE_URL}/api/mira/chat", json=payload)
        assert response.status_code == 200
        data = response.json()
        
        concierge_action = data.get("concierge_action", {})
        if concierge_action.get("action_needed"):
            action_type = concierge_action.get("action_type", "")
            # Should be care-related
            assert "care" in action_type.lower() or action_type == "care_appointment", \
                f"Expected care action for vet, got: {action_type}"
            print(f"✅ Vet request returns action_type='{action_type}'")


class TestTicketCreationServiceType:
    """Tests for ticket creation with correct service_type"""
    
    def test_grooming_ticket_has_correct_service_type(self):
        """P1: Tickets created for grooming should have service_type='grooming'"""
        # First create a quick booking
        payload = {
            "date": "2026-01-22",
            "time": "11:00",
            "notes": "Test grooming ticket",
            "serviceType": "grooming",
            "session_id": "test-ticket-grooming"
        }
        response = requests.post(f"{BASE_URL}/api/mira/quick-book", json=payload)
        assert response.status_code == 200
        data = response.json()
        
        ticket_id = data.get("ticket_id")
        assert ticket_id, "ticket_id should be returned"
        
        # Verify the service_type in response
        assert data.get("service_type") == "grooming", \
            f"Ticket service_type should be 'grooming', got: {data.get('service_type')}"
        
        print(f"✅ Grooming ticket {ticket_id} created with service_type='grooming'")


class TestWordBoundaryRegex:
    """Unit tests for word boundary regex matching"""
    
    def test_word_boundary_grooming_vs_room(self):
        """Verify regex word boundary prevents 'room' matching 'grooming'"""
        import re
        
        # This is the pattern used in detect_concierge_action_needed
        grooming_pattern = r'\b' + re.escape("grooming") + r'\b'
        room_pattern = r'\b' + re.escape("room") + r'\b'
        
        test_messages = [
            ("I need grooming for my dog", True, False),  # grooming=True, room=False
            ("I need a room for my dog", False, True),    # grooming=False, room=True
            ("book grooming appointment", True, False),
            ("hotel room booking", False, True),
            ("grooming salon", True, False),
            ("bathroom", False, False),  # Neither should match
        ]
        
        for message, expect_grooming, expect_room in test_messages:
            message_lower = message.lower()
            has_grooming = bool(re.search(grooming_pattern, message_lower))
            has_room = bool(re.search(room_pattern, message_lower))
            
            assert has_grooming == expect_grooming, \
                f"'{message}': expected grooming={expect_grooming}, got {has_grooming}"
            assert has_room == expect_room, \
                f"'{message}': expected room={expect_room}, got {has_room}"
        
        print("✅ Word boundary regex correctly distinguishes 'grooming' from 'room'")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
