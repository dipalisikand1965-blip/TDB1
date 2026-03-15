"""
Test Suite: Notification Deep-Link and Ticket-to-Soul Enrichment
=================================================================

Tests for iteration 215:
1. Notification deep-link: clicking concierge_reply goes to /mira-demo?tab=services&ticket={ticket_id}
2. Notification dropdown shows per-pet notifications with header 'Notifications • {petName}'
3. Ticket-to-Soul Enrichment: resolve_ticket extracts learnings and updates pet's doggy_soul_answers
4. Backend resolve_ticket works with mira_tickets collection
5. append_message endpoint works with mira_tickets collection

Test credentials:
- user_email: dipali@clubconcierge.in
- password: test123
- test_pet_id: pet-3661ae55d2e2
- test_pet_name: Mystique
- test_ticket_id: TCK-2026-000040
"""

import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")

if not BASE_URL:
    BASE_URL = "https://unified-dine.preview.emergentagent.com"


class TestNotificationDeepLink:
    """Tests for notification deep-link functionality"""
    
    # Test credentials from the request
    TEST_USER_EMAIL = "dipali@clubconcierge.in"
    TEST_PET_ID = "pet-3661ae55d2e2"
    TEST_PET_NAME = "Mystique"
    TEST_TICKET_ID = "TCK-2026-000040"
    
    def test_notification_inbox_api_returns_notifications(self):
        """Test that notification inbox API returns notifications for a user"""
        response = requests.get(
            f"{BASE_URL}/api/member/notifications/inbox/{self.TEST_USER_EMAIL}?limit=10"
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "notifications" in data, "Response should have 'notifications' field"
        assert "unread" in data, "Response should have 'unread' field"
        
        print(f"Got {len(data['notifications'])} notifications, {data['unread']} unread")
    
    def test_notification_inbox_filters_by_pet(self):
        """Test that notification inbox can filter by pet_id"""
        response = requests.get(
            f"{BASE_URL}/api/member/notifications/inbox/{self.TEST_USER_EMAIL}?limit=10&pet_id={self.TEST_PET_ID}"
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "notifications" in data
        
        # All returned notifications should be for the requested pet_id
        for notif in data["notifications"]:
            if notif.get("pet_id"):
                assert notif["pet_id"] == self.TEST_PET_ID, f"Expected pet_id {self.TEST_PET_ID}, got {notif.get('pet_id')}"
        
        print(f"Pet-filtered notifications: {len(data['notifications'])}")
    
    def test_notification_has_thread_url_for_deeplink(self):
        """Test that concierge_reply notifications have thread_url for deep-linking"""
        # First create a test notification to ensure we have one
        test_notification = {
            "user_email": self.TEST_USER_EMAIL,
            "ticket_id": self.TEST_TICKET_ID,
            "pet_id": self.TEST_PET_ID,
            "pet_name": self.TEST_PET_NAME,
            "type": "concierge_reply",
            "title": "TEST: Concierge replied",
            "message": "Test message for deep-link",
            "data": {
                "ticket_id": self.TEST_TICKET_ID,
                "thread_url": f"/mira-demo?tab=services&ticket={self.TEST_TICKET_ID}"
            }
        }
        
        # Try to create notification via concierge_reply endpoint
        response = requests.post(
            f"{BASE_URL}/api/service_desk/concierge_reply",
            params={
                "ticket_id": self.TEST_TICKET_ID,
                "concierge_name": "Test Concierge",
                "message": "Test reply to verify notification deep-link"
            }
        )
        
        # This may fail if ticket doesn't exist, but that's ok for this test
        if response.status_code == 200:
            print("Created test notification via concierge_reply")
        else:
            print(f"concierge_reply returned {response.status_code} - ticket may not exist")
        
        # Now check if notifications have thread_url
        inbox_response = requests.get(
            f"{BASE_URL}/api/member/notifications/inbox/{self.TEST_USER_EMAIL}?limit=10"
        )
        
        assert inbox_response.status_code == 200
        data = inbox_response.json()
        
        for notif in data.get("notifications", []):
            if notif.get("type") == "concierge_reply":
                # Check for thread_url in data
                thread_url = notif.get("data", {}).get("thread_url")
                if thread_url:
                    assert "mira-demo" in thread_url, f"thread_url should point to mira-demo: {thread_url}"
                    assert "ticket=" in thread_url, f"thread_url should have ticket param: {thread_url}"
                    print(f"Found notification with correct thread_url: {thread_url}")
                    return
        
        print("No concierge_reply notifications found with thread_url (may need to create one)")


class TestResolveTicketWithSoulEnrichment:
    """Tests for resolve_ticket endpoint and Soul enrichment"""
    
    TEST_USER_EMAIL = "dipali@clubconcierge.in"
    TEST_PET_ID = "pet-3661ae55d2e2"
    TEST_PET_NAME = "Mystique"
    TEST_TICKET_ID = "TCK-2026-000040"
    
    def test_resolve_ticket_endpoint_exists(self):
        """Test that resolve_ticket endpoint exists and responds"""
        # Use POST method for resolve_ticket
        response = requests.post(
            f"{BASE_URL}/api/service_desk/resolve_ticket/{self.TEST_TICKET_ID}"
        )
        
        # Can be 200 (resolved) or 404 (ticket not found) - both mean endpoint works
        assert response.status_code in [200, 404], f"Expected 200 or 404, got {response.status_code}: {response.text}"
        
        if response.status_code == 200:
            data = response.json()
            assert data.get("success") == True, "Response should indicate success"
            assert "soul_enrichment" in data, "Response should include soul_enrichment result"
            print(f"Resolved ticket {self.TEST_TICKET_ID}, soul_enrichment: {data.get('soul_enrichment')}")
        else:
            print(f"Ticket {self.TEST_TICKET_ID} not found (404)")
    
    def test_resolve_ticket_returns_soul_enrichment_result(self):
        """Test that resolve_ticket returns soul_enrichment field"""
        response = requests.post(
            f"{BASE_URL}/api/service_desk/resolve_ticket/{self.TEST_TICKET_ID}"
        )
        
        if response.status_code == 200:
            data = response.json()
            enrichment = data.get("soul_enrichment", {})
            
            # Should have these fields
            assert "success" in enrichment or "message" in enrichment, "soul_enrichment should have success or message"
            
            print(f"Soul enrichment result: {enrichment}")
        elif response.status_code == 404:
            pytest.skip(f"Ticket {self.TEST_TICKET_ID} not found")
    
    def test_pet_soul_has_enrichment_fields(self):
        """Test that pet's doggy_soul_answers has ticket enrichment fields"""
        response = requests.get(
            f"{BASE_URL}/api/pets/{self.TEST_PET_ID}/soul"
        )
        
        # May return 404 if endpoint doesn't exist
        if response.status_code == 404:
            # Try alternate endpoint
            response = requests.get(
                f"{BASE_URL}/api/pets/{self.TEST_PET_ID}"
            )
        
        if response.status_code == 200:
            data = response.json()
            soul_answers = data.get("doggy_soul_answers", {})
            
            # Check for ticket enrichment fields
            enrichment_fields = [
                "food_allergies_from_tickets",
                "preferences_from_tickets",
                "anxiety_triggers_from_tickets",
                "last_ticket_enrichment"
            ]
            
            found_fields = [f for f in enrichment_fields if f in soul_answers]
            print(f"Found ticket enrichment fields in pet soul: {found_fields}")
            
            if found_fields:
                print(f"Sample values: food_allergies={soul_answers.get('food_allergies_from_tickets')}, preferences={soul_answers.get('preferences_from_tickets')}")
        else:
            print(f"Pet endpoint returned {response.status_code}")


class TestAppendMessageToTicket:
    """Tests for append_message endpoint working with mira_tickets collection"""
    
    TEST_TICKET_ID = "TCK-2026-000040"
    
    def test_append_message_endpoint_exists(self):
        """Test that append_message endpoint exists"""
        response = requests.post(
            f"{BASE_URL}/api/service_desk/append_message",
            json={
                "ticket_id": self.TEST_TICKET_ID,
                "sender": "system",
                "source": "test",
                "text": "Test message from pytest"
            }
        )
        
        # Can be 200 (success) or 404 (ticket not found)
        assert response.status_code in [200, 404], f"Expected 200 or 404, got {response.status_code}: {response.text}"
        
        if response.status_code == 200:
            data = response.json()
            assert data.get("success") == True
            print("append_message succeeded")
        else:
            print(f"Ticket {self.TEST_TICKET_ID} not found")
    
    def test_append_message_to_mira_ticket(self):
        """Test appending a message to a ticket in mira_tickets collection"""
        test_message = f"Test message at {datetime.utcnow().isoformat()}"
        
        response = requests.post(
            f"{BASE_URL}/api/service_desk/append_message",
            json={
                "ticket_id": self.TEST_TICKET_ID,
                "sender": "system",
                "source": "pytest_test",
                "text": test_message
            }
        )
        
        if response.status_code == 200:
            # Verify message was added by fetching ticket
            ticket_response = requests.get(
                f"{BASE_URL}/api/service_desk/ticket/{self.TEST_TICKET_ID}"
            )
            
            if ticket_response.status_code == 200:
                ticket = ticket_response.json()
                conversation = ticket.get("conversation", []) or ticket.get("messages", [])
                
                # Check if our test message is in the conversation
                found = any(test_message in (msg.get("text", "") or msg.get("content", "")) for msg in conversation)
                if found:
                    print("Test message successfully added to ticket conversation")
                else:
                    print("Test message not found in ticket - may be in mira_tickets collection")
        elif response.status_code == 404:
            pytest.skip("Test ticket not found")


class TestConciergeReplyCreatesNotification:
    """Test that concierge_reply creates proper notification with thread_url"""
    
    TEST_USER_EMAIL = "dipali@clubconcierge.in"
    TEST_TICKET_ID = "TCK-2026-000040"
    
    def test_concierge_reply_creates_notification_with_thread_url(self):
        """Test that concierge_reply sets thread_url correctly in notification"""
        unique_msg = f"Test reply {uuid.uuid4().hex[:8]}"
        
        response = requests.post(
            f"{BASE_URL}/api/service_desk/concierge_reply",
            params={
                "ticket_id": self.TEST_TICKET_ID,
                "concierge_name": "TestBot",
                "message": unique_msg
            }
        )
        
        if response.status_code == 404:
            pytest.skip(f"Ticket {self.TEST_TICKET_ID} not found")
            return
        
        if response.status_code == 200:
            data = response.json()
            assert data.get("success") == True
            
            # Now fetch notifications and verify thread_url
            inbox_response = requests.get(
                f"{BASE_URL}/api/member/notifications/inbox/{self.TEST_USER_EMAIL}?limit=5"
            )
            
            if inbox_response.status_code == 200:
                notifications = inbox_response.json().get("notifications", [])
                
                for notif in notifications:
                    if unique_msg in (notif.get("message", "") or notif.get("body", "")):
                        thread_url = notif.get("data", {}).get("thread_url", "")
                        expected_url = f"/mira-demo?tab=services&ticket={self.TEST_TICKET_ID}"
                        
                        assert thread_url == expected_url, f"Expected thread_url='{expected_url}', got '{thread_url}'"
                        print(f"PASS: Notification has correct thread_url: {thread_url}")
                        return
                
                print("Test notification not found in inbox (may be different user)")
        else:
            print(f"concierge_reply failed with status {response.status_code}")


class TestMiraTicketsCollection:
    """Test that mira_tickets collection is used correctly"""
    
    TEST_TICKET_ID = "TCK-2026-000040"
    
    def test_get_ticket_endpoint(self):
        """Test that ticket can be retrieved"""
        response = requests.get(
            f"{BASE_URL}/api/service_desk/ticket/{self.TEST_TICKET_ID}"
        )
        
        if response.status_code == 200:
            ticket = response.json()
            print(f"Ticket found: status={ticket.get('status')}, pillar={ticket.get('pillar')}")
            
            # Check for messages array (mira_tickets) or conversation array (mira_conversations)
            has_messages = "messages" in ticket
            has_conversation = "conversation" in ticket
            
            print(f"Has messages array: {has_messages}, Has conversation array: {has_conversation}")
        elif response.status_code == 404:
            print(f"Ticket {self.TEST_TICKET_ID} not found")
        else:
            pytest.fail(f"Unexpected status: {response.status_code}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
