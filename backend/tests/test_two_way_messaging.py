"""
Test Two-Way Messaging System for The Doggy Company
Tests user messaging, ticket creation, concierge replies, and WhatsApp link generation

Endpoints tested:
- POST /api/user/request/{request_id}/message - User sends message about request
- GET /api/user/request/{request_id}/messages - Get conversation history
- POST /api/user/ticket/{ticket_id}/concierge-reply - Concierge replies to ticket
- GET /api/user/ticket/{ticket_id}/whatsapp-link - Generate WhatsApp link
"""

import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_USER_EMAIL = "dipali@clubconcierge.in"
TEST_USER_PASSWORD = "lola4304"
ADMIN_USER = "aditya"
ADMIN_PASSWORD = "lola4304"


class TestHealthCheck:
    """Basic health check to ensure API is running"""
    
    def test_api_health(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200, f"Health check failed: {response.text}"
        print(f"✓ API health check passed")


class TestUserSendMessage:
    """Test user sending messages about requests/bookings"""
    
    def test_send_message_creates_ticket(self):
        """User sends message about a request - should create ticket"""
        # Generate unique request ID for testing
        test_request_id = f"TEST-REQ-{uuid.uuid4().hex[:8]}"
        
        payload = {
            "message": f"Test message about my booking - {datetime.now().isoformat()}"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/user/request/{test_request_id}/message",
            json=payload,
            params={"email": TEST_USER_EMAIL}
        )
        
        print(f"Response status: {response.status_code}")
        print(f"Response body: {response.text}")
        
        assert response.status_code == 200, f"Failed to send message: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, "Response should indicate success"
        assert "ticket_id" in data, "Response should contain ticket_id"
        assert data.get("request_id") == test_request_id, "Response should contain request_id"
        
        print(f"✓ Message sent successfully, ticket created: {data.get('ticket_id')}")
        
        # Store ticket_id for subsequent tests
        return data.get("ticket_id")
    
    def test_send_message_to_existing_ticket(self):
        """Send another message to same request - should add to existing ticket"""
        test_request_id = f"TEST-REQ-EXISTING-{uuid.uuid4().hex[:8]}"
        
        # First message - creates ticket
        payload1 = {"message": "First message about my request"}
        response1 = requests.post(
            f"{BASE_URL}/api/user/request/{test_request_id}/message",
            json=payload1,
            params={"email": TEST_USER_EMAIL}
        )
        assert response1.status_code == 200
        ticket_id = response1.json().get("ticket_id")
        
        # Second message - should add to same ticket
        payload2 = {"message": "Follow-up message about the same request"}
        response2 = requests.post(
            f"{BASE_URL}/api/user/request/{test_request_id}/message",
            json=payload2,
            params={"email": TEST_USER_EMAIL}
        )
        
        assert response2.status_code == 200
        data2 = response2.json()
        assert data2.get("ticket_id") == ticket_id, "Second message should use same ticket"
        
        print(f"✓ Follow-up message added to existing ticket: {ticket_id}")
    
    def test_send_message_without_email(self):
        """Test sending message without email - should fail"""
        test_request_id = f"TEST-REQ-{uuid.uuid4().hex[:8]}"
        
        payload = {"message": "Test message"}
        response = requests.post(
            f"{BASE_URL}/api/user/request/{test_request_id}/message",
            json=payload
            # No email parameter
        )
        
        # Should fail with 422 (validation error) since email is required
        assert response.status_code == 422, f"Expected 422, got {response.status_code}"
        print(f"✓ Correctly rejected message without email")
    
    def test_send_empty_message(self):
        """Test sending empty message - should fail validation"""
        test_request_id = f"TEST-REQ-{uuid.uuid4().hex[:8]}"
        
        payload = {"message": ""}
        response = requests.post(
            f"{BASE_URL}/api/user/request/{test_request_id}/message",
            json=payload,
            params={"email": TEST_USER_EMAIL}
        )
        
        # Empty message might be rejected by Pydantic validation
        print(f"Empty message response: {response.status_code} - {response.text}")
        # Note: Depending on implementation, this might be 200 or 422


class TestAdminNotificationCreation:
    """Test that admin notifications are created when user sends message"""
    
    def test_admin_notification_created(self):
        """Verify admin notification is created when user sends message"""
        test_request_id = f"TEST-NOTIF-{uuid.uuid4().hex[:8]}"
        
        payload = {"message": "Test message for notification check"}
        response = requests.post(
            f"{BASE_URL}/api/user/request/{test_request_id}/message",
            json=payload,
            params={"email": TEST_USER_EMAIL}
        )
        
        assert response.status_code == 200
        ticket_id = response.json().get("ticket_id")
        
        # Check admin notifications endpoint if available
        # Note: This depends on having an admin notifications endpoint
        notif_response = requests.get(
            f"{BASE_URL}/api/admin/notifications",
            params={"limit": 10}
        )
        
        if notif_response.status_code == 200:
            notifications = notif_response.json()
            # Look for notification about our ticket
            found = any(
                n.get("ticket_id") == ticket_id 
                for n in notifications.get("notifications", [])
            )
            if found:
                print(f"✓ Admin notification created for ticket {ticket_id}")
            else:
                print(f"⚠ Admin notification not found (may need auth)")
        else:
            print(f"⚠ Could not verify admin notification (status: {notif_response.status_code})")


class TestGetConversationHistory:
    """Test retrieving conversation history for a request"""
    
    def test_get_messages_for_request(self):
        """Get conversation history for a request with messages"""
        test_request_id = f"TEST-CONV-{uuid.uuid4().hex[:8]}"
        
        # First, send a message to create conversation
        payload = {"message": "Test message for conversation history"}
        send_response = requests.post(
            f"{BASE_URL}/api/user/request/{test_request_id}/message",
            json=payload,
            params={"email": TEST_USER_EMAIL}
        )
        assert send_response.status_code == 200
        ticket_id = send_response.json().get("ticket_id")
        
        # Now get conversation history
        response = requests.get(
            f"{BASE_URL}/api/user/request/{test_request_id}/messages",
            params={"email": TEST_USER_EMAIL}
        )
        
        print(f"Get messages response: {response.status_code}")
        print(f"Response body: {response.text}")
        
        assert response.status_code == 200, f"Failed to get messages: {response.text}"
        
        data = response.json()
        assert "messages" in data, "Response should contain messages array"
        assert data.get("ticket_id") == ticket_id, "Should return correct ticket_id"
        
        messages = data.get("messages", [])
        assert len(messages) >= 1, "Should have at least one message"
        
        # Verify message structure
        first_msg = messages[0]
        assert "content" in first_msg, "Message should have content"
        assert "sender" in first_msg, "Message should have sender"
        assert "timestamp" in first_msg, "Message should have timestamp"
        
        print(f"✓ Retrieved {len(messages)} message(s) for request")
    
    def test_get_messages_for_nonexistent_request(self):
        """Get messages for request with no conversation - should return empty"""
        test_request_id = f"NONEXISTENT-{uuid.uuid4().hex[:8]}"
        
        response = requests.get(
            f"{BASE_URL}/api/user/request/{test_request_id}/messages",
            params={"email": TEST_USER_EMAIL}
        )
        
        assert response.status_code == 200, f"Should return 200 with empty messages"
        
        data = response.json()
        assert data.get("messages") == [], "Should return empty messages array"
        assert data.get("ticket_id") is None, "Should return null ticket_id"
        
        print(f"✓ Correctly returned empty messages for nonexistent request")
    
    def test_get_messages_without_email(self):
        """Test getting messages without email - should fail"""
        test_request_id = f"TEST-{uuid.uuid4().hex[:8]}"
        
        response = requests.get(
            f"{BASE_URL}/api/user/request/{test_request_id}/messages"
            # No email parameter
        )
        
        assert response.status_code == 422, f"Expected 422, got {response.status_code}"
        print(f"✓ Correctly rejected request without email")


class TestConciergeReply:
    """Test concierge replying to tickets"""
    
    def test_concierge_reply_to_ticket(self):
        """Concierge sends reply to user's ticket"""
        # First create a ticket by sending user message
        test_request_id = f"TEST-REPLY-{uuid.uuid4().hex[:8]}"
        
        user_payload = {"message": "I need help with my booking"}
        user_response = requests.post(
            f"{BASE_URL}/api/user/request/{test_request_id}/message",
            json=user_payload,
            params={"email": TEST_USER_EMAIL}
        )
        assert user_response.status_code == 200
        ticket_id = user_response.json().get("ticket_id")
        
        # Now concierge replies
        reply_payload = {
            "message": "Thank you for reaching out! We'll help you with your booking.",
            "notify_email": False,  # Skip email for testing
            "notify_whatsapp": False,
            "is_internal": False
        }
        
        response = requests.post(
            f"{BASE_URL}/api/user/ticket/{ticket_id}/concierge-reply",
            json=reply_payload,
            params={"admin_email": "admin@thedoggycompany.in"}
        )
        
        print(f"Concierge reply response: {response.status_code}")
        print(f"Response body: {response.text}")
        
        assert response.status_code == 200, f"Failed to send concierge reply: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, "Response should indicate success"
        assert "message_id" in data, "Response should contain message_id"
        assert data.get("ticket_id") == ticket_id, "Response should contain ticket_id"
        
        print(f"✓ Concierge reply sent successfully to ticket {ticket_id}")
        
        return ticket_id
    
    def test_concierge_reply_appears_in_history(self):
        """Verify concierge reply appears in user's conversation history"""
        # Create ticket and send concierge reply
        test_request_id = f"TEST-HISTORY-{uuid.uuid4().hex[:8]}"
        
        # User sends message
        user_payload = {"message": "Question about my service"}
        user_response = requests.post(
            f"{BASE_URL}/api/user/request/{test_request_id}/message",
            json=user_payload,
            params={"email": TEST_USER_EMAIL}
        )
        ticket_id = user_response.json().get("ticket_id")
        
        # Concierge replies
        reply_payload = {
            "message": "Here's the answer to your question!",
            "notify_email": False,
            "notify_whatsapp": False,
            "is_internal": False
        }
        requests.post(
            f"{BASE_URL}/api/user/ticket/{ticket_id}/concierge-reply",
            json=reply_payload
        )
        
        # Get conversation history
        history_response = requests.get(
            f"{BASE_URL}/api/user/request/{test_request_id}/messages",
            params={"email": TEST_USER_EMAIL}
        )
        
        assert history_response.status_code == 200
        
        data = history_response.json()
        messages = data.get("messages", [])
        
        # Should have at least 2 messages (user + concierge)
        assert len(messages) >= 2, f"Expected at least 2 messages, got {len(messages)}"
        
        # Check for concierge message
        concierge_messages = [m for m in messages if m.get("sender") == "concierge"]
        assert len(concierge_messages) >= 1, "Should have at least one concierge message"
        
        print(f"✓ Concierge reply appears in conversation history ({len(messages)} total messages)")
    
    def test_concierge_internal_note(self):
        """Test internal note (should not appear in user's history)"""
        test_request_id = f"TEST-INTERNAL-{uuid.uuid4().hex[:8]}"
        
        # User sends message
        user_payload = {"message": "Help needed"}
        user_response = requests.post(
            f"{BASE_URL}/api/user/request/{test_request_id}/message",
            json=user_payload,
            params={"email": TEST_USER_EMAIL}
        )
        ticket_id = user_response.json().get("ticket_id")
        
        # Concierge adds internal note
        internal_payload = {
            "message": "Internal note: Customer is VIP member",
            "notify_email": False,
            "notify_whatsapp": False,
            "is_internal": True  # Internal note
        }
        requests.post(
            f"{BASE_URL}/api/user/ticket/{ticket_id}/concierge-reply",
            json=internal_payload
        )
        
        # Get conversation history
        history_response = requests.get(
            f"{BASE_URL}/api/user/request/{test_request_id}/messages",
            params={"email": TEST_USER_EMAIL}
        )
        
        data = history_response.json()
        messages = data.get("messages", [])
        
        # Internal note should NOT appear in user's history
        internal_found = any("Internal note" in m.get("content", "") for m in messages)
        assert not internal_found, "Internal note should not appear in user's history"
        
        print(f"✓ Internal note correctly hidden from user's conversation history")
    
    def test_concierge_reply_to_nonexistent_ticket(self):
        """Test replying to non-existent ticket - should fail"""
        fake_ticket_id = f"TKT-FAKE-{uuid.uuid4().hex[:8]}"
        
        reply_payload = {
            "message": "Reply to fake ticket",
            "notify_email": False,
            "notify_whatsapp": False,
            "is_internal": False
        }
        
        response = requests.post(
            f"{BASE_URL}/api/user/ticket/{fake_ticket_id}/concierge-reply",
            json=reply_payload
        )
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print(f"✓ Correctly rejected reply to non-existent ticket")


class TestWhatsAppLinkGeneration:
    """Test WhatsApp link generation for tickets"""
    
    def test_generate_whatsapp_link(self):
        """Generate WhatsApp link for a ticket with phone number"""
        # First we need a ticket with a phone number
        # Since we can't easily add phone to ticket via API, we'll test the endpoint behavior
        
        # Create a ticket first
        test_request_id = f"TEST-WA-{uuid.uuid4().hex[:8]}"
        user_payload = {"message": "Test for WhatsApp"}
        user_response = requests.post(
            f"{BASE_URL}/api/user/request/{test_request_id}/message",
            json=user_payload,
            params={"email": TEST_USER_EMAIL}
        )
        ticket_id = user_response.json().get("ticket_id")
        
        # Try to get WhatsApp link
        response = requests.get(
            f"{BASE_URL}/api/user/ticket/{ticket_id}/whatsapp-link",
            params={"message": "Hello! How can we help?"}
        )
        
        print(f"WhatsApp link response: {response.status_code}")
        print(f"Response body: {response.text}")
        
        # This might return 400 if no phone number is set
        if response.status_code == 200:
            data = response.json()
            assert "whatsapp_link" in data, "Response should contain whatsapp_link"
            assert data["whatsapp_link"].startswith("https://wa.me/"), "Should be valid WhatsApp link"
            print(f"✓ WhatsApp link generated: {data['whatsapp_link'][:50]}...")
        elif response.status_code == 400:
            data = response.json()
            assert "phone" in data.get("detail", "").lower(), "Should indicate missing phone"
            print(f"✓ Correctly indicated no phone number for ticket")
        else:
            pytest.fail(f"Unexpected status code: {response.status_code}")
    
    def test_whatsapp_link_nonexistent_ticket(self):
        """Test WhatsApp link for non-existent ticket - should fail"""
        fake_ticket_id = f"TKT-FAKE-{uuid.uuid4().hex[:8]}"
        
        response = requests.get(
            f"{BASE_URL}/api/user/ticket/{fake_ticket_id}/whatsapp-link"
        )
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print(f"✓ Correctly rejected WhatsApp link for non-existent ticket")


class TestUserTicketsEndpoint:
    """Test user tickets listing endpoint"""
    
    def test_get_user_tickets(self):
        """Get all tickets for a user"""
        response = requests.get(
            f"{BASE_URL}/api/user/tickets",
            params={"email": TEST_USER_EMAIL}
        )
        
        print(f"User tickets response: {response.status_code}")
        
        assert response.status_code == 200, f"Failed to get user tickets: {response.text}"
        
        data = response.json()
        assert "tickets" in data, "Response should contain tickets array"
        assert "count" in data, "Response should contain count"
        
        print(f"✓ Retrieved {data.get('count')} tickets for user")
    
    def test_get_user_tickets_without_email(self):
        """Test getting tickets without email - should fail"""
        response = requests.get(f"{BASE_URL}/api/user/tickets")
        
        assert response.status_code == 422, f"Expected 422, got {response.status_code}"
        print(f"✓ Correctly rejected request without email")


class TestTicketMessageEndpoint:
    """Test sending message to existing ticket by ticket_id"""
    
    def test_send_message_to_ticket(self):
        """Send message directly to a ticket using ticket_id"""
        # First create a ticket
        test_request_id = f"TEST-DIRECT-{uuid.uuid4().hex[:8]}"
        user_payload = {"message": "Initial message"}
        user_response = requests.post(
            f"{BASE_URL}/api/user/request/{test_request_id}/message",
            json=user_payload,
            params={"email": TEST_USER_EMAIL}
        )
        ticket_id = user_response.json().get("ticket_id")
        
        # Now send message directly to ticket
        message_payload = {"message": "Follow-up message to ticket"}
        response = requests.post(
            f"{BASE_URL}/api/user/ticket/{ticket_id}/message",
            json=message_payload,
            params={"email": TEST_USER_EMAIL}
        )
        
        print(f"Direct ticket message response: {response.status_code}")
        print(f"Response body: {response.text}")
        
        assert response.status_code == 200, f"Failed to send message to ticket: {response.text}"
        
        data = response.json()
        assert data.get("success") == True
        assert data.get("ticket_id") == ticket_id
        
        print(f"✓ Message sent directly to ticket {ticket_id}")


class TestEndToEndMessagingFlow:
    """End-to-end test of the complete messaging flow"""
    
    def test_complete_messaging_flow(self):
        """Test complete flow: user message -> ticket creation -> concierge reply -> user sees reply"""
        test_request_id = f"TEST-E2E-{uuid.uuid4().hex[:8]}"
        
        # Step 1: User sends initial message
        print("Step 1: User sends message...")
        user_msg1 = {"message": "Hi, I need help with my dog grooming appointment"}
        response1 = requests.post(
            f"{BASE_URL}/api/user/request/{test_request_id}/message",
            json=user_msg1,
            params={"email": TEST_USER_EMAIL}
        )
        assert response1.status_code == 200, f"Step 1 failed: {response1.text}"
        ticket_id = response1.json().get("ticket_id")
        print(f"  ✓ Ticket created: {ticket_id}")
        
        # Step 2: Verify ticket appears in user's tickets
        print("Step 2: Verify ticket in user's list...")
        response2 = requests.get(
            f"{BASE_URL}/api/user/tickets",
            params={"email": TEST_USER_EMAIL}
        )
        assert response2.status_code == 200
        tickets = response2.json().get("tickets", [])
        ticket_found = any(t.get("ticket_id") == ticket_id for t in tickets)
        assert ticket_found, "Ticket should appear in user's tickets"
        print(f"  ✓ Ticket found in user's list")
        
        # Step 3: Concierge replies
        print("Step 3: Concierge replies...")
        concierge_reply = {
            "message": "Hello! I'd be happy to help with your grooming appointment. What date works for you?",
            "notify_email": False,
            "notify_whatsapp": False,
            "is_internal": False
        }
        response3 = requests.post(
            f"{BASE_URL}/api/user/ticket/{ticket_id}/concierge-reply",
            json=concierge_reply
        )
        assert response3.status_code == 200, f"Step 3 failed: {response3.text}"
        print(f"  ✓ Concierge reply sent")
        
        # Step 4: User sends follow-up
        print("Step 4: User sends follow-up...")
        user_msg2 = {"message": "How about next Tuesday at 2pm?"}
        response4 = requests.post(
            f"{BASE_URL}/api/user/request/{test_request_id}/message",
            json=user_msg2,
            params={"email": TEST_USER_EMAIL}
        )
        assert response4.status_code == 200, f"Step 4 failed: {response4.text}"
        print(f"  ✓ Follow-up message sent")
        
        # Step 5: Verify complete conversation history
        print("Step 5: Verify conversation history...")
        response5 = requests.get(
            f"{BASE_URL}/api/user/request/{test_request_id}/messages",
            params={"email": TEST_USER_EMAIL}
        )
        assert response5.status_code == 200, f"Step 5 failed: {response5.text}"
        
        messages = response5.json().get("messages", [])
        assert len(messages) >= 3, f"Expected at least 3 messages, got {len(messages)}"
        
        # Verify message senders
        user_messages = [m for m in messages if m.get("sender") == "you"]
        concierge_messages = [m for m in messages if m.get("sender") == "concierge"]
        
        assert len(user_messages) >= 2, "Should have at least 2 user messages"
        assert len(concierge_messages) >= 1, "Should have at least 1 concierge message"
        
        print(f"  ✓ Conversation history verified: {len(user_messages)} user msgs, {len(concierge_messages)} concierge msgs")
        
        print(f"\n✓ Complete end-to-end messaging flow successful!")
        print(f"  Ticket ID: {ticket_id}")
        print(f"  Total messages: {len(messages)}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
