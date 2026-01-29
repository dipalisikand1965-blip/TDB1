"""
Test Suite: Timestamp Sorting Verification
==========================================
Verifies that new notifications/tickets appear at TOP of lists (sorted by newest first)
"""

import pytest
import requests
import os
import uuid
import time
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestTimestampSorting:
    """Verify timestamp sorting - newest first"""
    
    def test_notifications_sorted_newest_first(self):
        """Create a new request and verify it appears at TOP of notifications list"""
        # Create a unique care request
        unique_id = uuid.uuid4().hex[:8]
        pet_name = f"TEST_SortVerify_{unique_id}"
        
        response = requests.post(f"{BASE_URL}/api/care/request", json={
            "care_type": "grooming",
            "pet_name": pet_name,
            "pet_breed": "Sorting Test Dog",
            "description": f"Timestamp sorting test {unique_id}",
            "user_email": f"test_sort_{unique_id}@example.com",
            "user_name": "Test Sort User",
            "user_phone": "9876543299"
        })
        
        assert response.status_code == 200, f"Failed to create request: {response.text}"
        data = response.json()
        notification_id = data.get("notification_id")
        
        # Small delay to ensure DB write completes
        time.sleep(0.5)
        
        # Get admin notifications (should be sorted by newest first)
        notif_response = requests.get(f"{BASE_URL}/api/admin/notifications")
        assert notif_response.status_code == 200, f"Failed to get notifications: {notif_response.text}"
        
        notifications = notif_response.json().get("notifications", [])
        
        # Verify our notification is in the list
        found = False
        position = -1
        for idx, notif in enumerate(notifications):
            if notif.get("id") == notification_id:
                found = True
                position = idx
                break
        
        assert found, f"Notification {notification_id} not found in list"
        
        # Verify it's at the TOP (position 0 or very close to top)
        # Allow for some concurrent requests, but should be in top 5
        assert position < 5, f"Notification at position {position}, expected at TOP (< 5)"
        
        print(f"✅ Notification {notification_id} found at position {position} (TOP of list)")
        
        # Verify timestamps are in descending order (newest first)
        if len(notifications) >= 2:
            first_ts = notifications[0].get("created_at", "")
            second_ts = notifications[1].get("created_at", "")
            
            # Both should have consistent format
            assert first_ts >= second_ts, f"Timestamps not sorted correctly: {first_ts} should be >= {second_ts}"
            print(f"✅ Timestamps sorted correctly: {first_ts[:25]}... >= {second_ts[:25]}...")
    
    def test_service_desk_tickets_sorted_newest_first(self):
        """Create a new request and verify ticket appears at TOP of service desk list"""
        # Create a unique travel request
        unique_id = uuid.uuid4().hex[:8]
        pet_name = f"TEST_TicketSort_{unique_id}"
        
        response = requests.post(f"{BASE_URL}/api/travel/request", json={
            "travel_type": "cab",
            "pet_name": pet_name,
            "pet_breed": "Ticket Sort Dog",
            "pickup_location": "Test Location A",
            "dropoff_location": "Test Location B",
            "travel_date": "2026-02-20",
            "user_email": f"test_ticket_{unique_id}@example.com",
            "user_name": "Test Ticket User",
            "user_phone": "9876543298"
        })
        
        assert response.status_code == 200, f"Failed to create request: {response.text}"
        data = response.json()
        ticket_id = data.get("ticket_id") or data.get("request_id")
        
        # Small delay
        time.sleep(0.5)
        
        # Get service desk tickets
        tickets_response = requests.get(f"{BASE_URL}/api/admin/service-desk/tickets")
        assert tickets_response.status_code == 200, f"Failed to get tickets: {tickets_response.text}"
        
        tickets = tickets_response.json().get("tickets", [])
        
        # Verify our ticket is in the list
        found = False
        position = -1
        for idx, ticket in enumerate(tickets):
            if ticket.get("ticket_id") == ticket_id:
                found = True
                position = idx
                break
        
        assert found, f"Ticket {ticket_id} not found in list"
        
        # Verify it's at the TOP
        assert position < 5, f"Ticket at position {position}, expected at TOP (< 5)"
        
        print(f"✅ Ticket {ticket_id} found at position {position} (TOP of list)")
    
    def test_timestamp_format_consistency(self):
        """Verify all timestamps use consistent format: YYYY-MM-DDTHH:MM:SS.fff+00:00"""
        # Create a request
        unique_id = uuid.uuid4().hex[:8]
        
        response = requests.post(f"{BASE_URL}/api/fit/request", json={
            "fit_type": "fitness_plan",
            "pet_name": f"TEST_TSFormat_{unique_id}",
            "pet_breed": "Format Test Dog",
            "description": "Timestamp format test",
            "user_email": f"test_format_{unique_id}@example.com",
            "user_name": "Test Format User",
            "user_phone": "9876543297"
        })
        
        assert response.status_code == 200
        data = response.json()
        notification_id = data.get("notification_id")
        
        time.sleep(0.5)
        
        # Get the notification
        notif_response = requests.get(f"{BASE_URL}/api/admin/notifications")
        notifications = notif_response.json().get("notifications", [])
        
        # Find our notification
        our_notif = None
        for notif in notifications:
            if notif.get("id") == notification_id:
                our_notif = notif
                break
        
        assert our_notif, f"Notification {notification_id} not found"
        
        created_at = our_notif.get("created_at", "")
        
        # Verify format: YYYY-MM-DDTHH:MM:SS.fff+00:00
        # Example: 2026-01-15T10:30:45.123+00:00
        import re
        pattern = r'^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}\+00:00$'
        
        assert re.match(pattern, created_at), f"Timestamp format incorrect: {created_at}. Expected: YYYY-MM-DDTHH:MM:SS.fff+00:00"
        
        print(f"✅ Timestamp format correct: {created_at}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
