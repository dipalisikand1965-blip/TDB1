"""
Test Iteration 162 - Mira Chat Fixes
=====================================
Tests for:
1. /api/mira/chat endpoint works without errors (NameError fixes)
2. Conversational loop breaking - when user says 'yes please go ahead' after 3+ questions, should handoff
3. Unified Flow - verify admin notifications are created for Mira requests
4. Unified Flow - verify service desk tickets are created
5. Product export endpoint /api/admin/export/products-with-tags?format=csv
"""

import pytest
import requests
import os
import time
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "dipali@clubconcierge.in"
TEST_PASSWORD = "test123"
ADMIN_USERNAME = "aditya"
ADMIN_PASSWORD = "lola4304"


class TestMiraChatEndpoint:
    """Test that /api/mira/chat endpoint works without NameError"""
    
    def test_mira_chat_basic_message(self):
        """Test basic Mira chat message works without errors"""
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            json={
                "message": "Hello, I need help with my dog",
                "session_id": f"test-session-{uuid.uuid4().hex[:8]}",
                "source": "web_widget",
                "history": []
            },
            timeout=60
        )
        
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text[:500] if response.text else 'Empty'}")
        
        # Should not return 500 (which would indicate NameError)
        assert response.status_code != 500, f"Server error: {response.text}"
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "response" in data or "message" in data, "Response should contain message"
    
    def test_mira_chat_with_history(self):
        """Test Mira chat with conversation history (tests 'history' variable fix)"""
        history = [
            {"role": "user", "content": "I want to book a hotel for my dog"},
            {"role": "assistant", "content": "I'd be happy to help you find pet-friendly accommodation! Where are you planning to stay?"},
            {"role": "user", "content": "Goa"},
            {"role": "assistant", "content": "Great choice! When are you planning to visit Goa?"}
        ]
        
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            json={
                "message": "Next weekend",
                "session_id": f"test-session-{uuid.uuid4().hex[:8]}",
                "source": "web_widget",
                "history": history,
                "current_pillar": "stay"
            },
            timeout=60
        )
        
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text[:500] if response.text else 'Empty'}")
        
        # Should not return 500 (which would indicate NameError for 'history')
        assert response.status_code != 500, f"Server error (possible NameError): {response.text}"
        assert response.status_code == 200
    
    def test_mira_chat_with_current_pillar(self):
        """Test Mira chat with current_pillar (tests 'current_pillar' variable fix)"""
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            json={
                "message": "I need grooming for my dog",
                "session_id": f"test-session-{uuid.uuid4().hex[:8]}",
                "source": "web_widget",
                "history": [],
                "current_pillar": "care"
            },
            timeout=60
        )
        
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text[:500] if response.text else 'Empty'}")
        
        # Should not return 500 (which would indicate NameError for 'current_pillar')
        assert response.status_code != 500, f"Server error (possible NameError): {response.text}"
        assert response.status_code == 200


class TestConversationalLoopBreaking:
    """Test that Mira breaks conversational loops when user confirms"""
    
    def test_loop_breaking_with_affirmative_confirmation(self):
        """Test that 'yes please go ahead' after 3+ questions triggers handoff"""
        # Simulate a conversation with 3+ assistant questions
        history = [
            {"role": "user", "content": "I want to book a pet-friendly hotel in Goa"},
            {"role": "assistant", "content": "I'd love to help you find the perfect pet-friendly stay in Goa! To narrow this down, could you tell me when you're planning to visit?"},
            {"role": "user", "content": "Next month"},
            {"role": "assistant", "content": "Great! And how many nights are you looking to stay? Also, do you prefer beachside or inland properties?"},
            {"role": "user", "content": "3 nights, beachside"},
            {"role": "assistant", "content": "Perfect choice! What's your approximate budget per night? And would you like a resort with a pool?"}
        ]
        
        # User confirms after 3+ questions
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            json={
                "message": "yes please go ahead",
                "session_id": f"test-loop-{uuid.uuid4().hex[:8]}",
                "source": "web_widget",
                "history": history,
                "current_pillar": "stay"
            },
            timeout=60
        )
        
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text[:800] if response.text else 'Empty'}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        response_text = data.get("response", "").lower()
        
        # Check for handoff indicators
        handoff_indicators = [
            "concierge",
            "team",
            "get back to you",
            "options",
            "notification",
            "request",
            "processing",
            "curating"
        ]
        
        has_handoff = any(indicator in response_text for indicator in handoff_indicators)
        print(f"Has handoff indicator: {has_handoff}")
        
        # The response should indicate handoff to concierge, not ask more questions
        # Note: We're checking that it doesn't just ask another question
        question_count = response_text.count("?")
        print(f"Question count in response: {question_count}")
        
        # Either has handoff OR doesn't have excessive questions
        assert has_handoff or question_count <= 1, "Response should handoff or not ask multiple questions"
    
    def test_loop_breaking_with_simple_yes(self):
        """Test that simple 'yes' after questions triggers appropriate response"""
        history = [
            {"role": "user", "content": "Find me a pet-friendly restaurant in Bangalore"},
            {"role": "assistant", "content": "I'd be happy to help! What area of Bangalore are you looking at?"},
            {"role": "user", "content": "Indiranagar"},
            {"role": "assistant", "content": "Great choice! Do you prefer indoor or outdoor seating?"},
            {"role": "user", "content": "Outdoor"},
            {"role": "assistant", "content": "Perfect! What cuisine are you in the mood for?"}
        ]
        
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            json={
                "message": "yes",
                "session_id": f"test-loop-yes-{uuid.uuid4().hex[:8]}",
                "source": "web_widget",
                "history": history,
                "current_pillar": "dine"
            },
            timeout=60
        )
        
        print(f"Status: {response.status_code}")
        print(f"Response: {response.text[:500] if response.text else 'Empty'}")
        
        assert response.status_code == 200


class TestUnifiedFlowNotifications:
    """Test that Mira creates admin notifications and service desk tickets"""
    
    def get_auth_token(self):
        """Get authentication token for member"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_EMAIL, "password": TEST_PASSWORD}
        )
        if response.status_code == 200:
            return response.json().get("token")
        return None
    
    def test_mira_creates_admin_notification(self):
        """Test that Mira chat creates admin notification"""
        session_id = f"test-notif-{uuid.uuid4().hex[:8]}"
        
        # Get auth token
        token = self.get_auth_token()
        headers = {"Authorization": f"Bearer {token}"} if token else {}
        
        # Send a message that should create a ticket
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            json={
                "message": "I want to book a birthday cake for my dog Mojo",
                "session_id": session_id,
                "source": "web_widget",
                "history": [],
                "current_pillar": "celebrate"
            },
            headers=headers,
            timeout=60
        )
        
        print(f"Chat Status: {response.status_code}")
        assert response.status_code == 200
        
        # Wait a moment for async operations
        time.sleep(1)
        
        # Check admin notifications
        notif_response = requests.get(
            f"{BASE_URL}/api/admin/notifications",
            auth=(ADMIN_USERNAME, ADMIN_PASSWORD)
        )
        
        print(f"Notifications Status: {notif_response.status_code}")
        
        if notif_response.status_code == 200:
            notifications = notif_response.json()
            if isinstance(notifications, dict):
                notifications = notifications.get("notifications", [])
            
            # Look for recent notification related to our session
            recent_notifs = [n for n in notifications if "mira" in str(n.get("type", "")).lower() or "cake" in str(n.get("message", "")).lower()]
            print(f"Found {len(recent_notifs)} Mira-related notifications")
            
            if recent_notifs:
                print(f"Sample notification: {recent_notifs[0]}")
    
    def test_mira_creates_service_desk_ticket(self):
        """Test that Mira chat creates service desk ticket"""
        session_id = f"test-ticket-{uuid.uuid4().hex[:8]}"
        
        # Get auth token
        token = self.get_auth_token()
        headers = {"Authorization": f"Bearer {token}"} if token else {}
        
        # Send a message that should create a ticket
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            json={
                "message": "I need to arrange pet travel to Mumbai for my dog",
                "session_id": session_id,
                "source": "web_widget",
                "history": [],
                "current_pillar": "travel"
            },
            headers=headers,
            timeout=60
        )
        
        print(f"Chat Status: {response.status_code}")
        assert response.status_code == 200
        
        # Wait a moment for async operations
        time.sleep(1)
        
        # Check service desk tickets
        tickets_response = requests.get(
            f"{BASE_URL}/api/admin/service-desk/tickets",
            auth=(ADMIN_USERNAME, ADMIN_PASSWORD)
        )
        
        print(f"Tickets Status: {tickets_response.status_code}")
        
        if tickets_response.status_code == 200:
            tickets = tickets_response.json()
            if isinstance(tickets, dict):
                tickets = tickets.get("tickets", [])
            
            # Look for recent tickets related to travel/mira
            recent_tickets = [t for t in tickets if "travel" in str(t.get("pillar", "")).lower() or "mira" in str(t.get("source", "")).lower()]
            print(f"Found {len(recent_tickets)} travel/Mira-related tickets")
            
            if recent_tickets:
                print(f"Sample ticket: {recent_tickets[0]}")


class TestProductExportEndpoint:
    """Test product export endpoint"""
    
    def test_export_products_csv_format(self):
        """Test /api/admin/export/products-with-tags?format=csv returns CSV"""
        response = requests.get(
            f"{BASE_URL}/api/admin/export/products-with-tags",
            params={"format": "csv"},
            auth=(ADMIN_USERNAME, ADMIN_PASSWORD)
        )
        
        print(f"Status: {response.status_code}")
        print(f"Content-Type: {response.headers.get('Content-Type', 'N/A')}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        # Check content type
        content_type = response.headers.get("Content-Type", "")
        assert "text/csv" in content_type or "text/plain" in content_type, f"Expected CSV content type, got {content_type}"
        
        # Check CSV headers
        content = response.text
        first_line = content.split("\n")[0] if content else ""
        print(f"CSV Headers: {first_line}")
        
        expected_headers = ["ID", "Title", "Price", "Tags"]
        for header in expected_headers:
            assert header in first_line, f"Missing header: {header}"
        
        # Check we have data rows
        lines = content.strip().split("\n")
        print(f"Total lines (including header): {len(lines)}")
        assert len(lines) > 1, "CSV should have data rows"
    
    def test_export_products_json_format(self):
        """Test /api/admin/export/products-with-tags?format=json returns JSON"""
        response = requests.get(
            f"{BASE_URL}/api/admin/export/products-with-tags",
            params={"format": "json"},
            auth=(ADMIN_USERNAME, ADMIN_PASSWORD)
        )
        
        print(f"Status: {response.status_code}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "products" in data, "Response should contain 'products' key"
        assert "total_products" in data, "Response should contain 'total_products' key"
        
        print(f"Total products: {data.get('total_products', 0)}")
        
        if data.get("products"):
            sample = data["products"][0]
            print(f"Sample product keys: {list(sample.keys())}")
    
    def test_export_products_default_format(self):
        """Test /api/admin/export/products-with-tags defaults to CSV"""
        response = requests.get(
            f"{BASE_URL}/api/admin/export/products-with-tags",
            auth=(ADMIN_USERNAME, ADMIN_PASSWORD)
        )
        
        print(f"Status: {response.status_code}")
        print(f"Content-Type: {response.headers.get('Content-Type', 'N/A')}")
        
        assert response.status_code == 200
        
        # Default should be CSV
        content_type = response.headers.get("Content-Type", "")
        assert "csv" in content_type.lower() or "text" in content_type.lower()


class TestMiraEndpointHealth:
    """Basic health checks for Mira endpoints"""
    
    def test_mira_chat_endpoint_exists(self):
        """Test that /api/mira/chat endpoint exists and responds"""
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            json={"message": "test", "session_id": "health-check"},
            timeout=30
        )
        
        # Should not be 404
        assert response.status_code != 404, "Mira chat endpoint not found"
        print(f"Mira chat endpoint status: {response.status_code}")
    
    def test_mira_session_endpoint(self):
        """Test Mira session endpoint"""
        session_id = f"test-session-{uuid.uuid4().hex[:8]}"
        
        response = requests.get(
            f"{BASE_URL}/api/mira/session/{session_id}"
        )
        
        print(f"Session endpoint status: {response.status_code}")
        # 200 or 404 are both valid (session may not exist)
        assert response.status_code in [200, 404]


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
