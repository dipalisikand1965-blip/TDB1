"""
Test Iteration 113: WhatsApp Mira AI Auto-Responses
Tests the new WhatsApp Mira pattern matching and response generation
"""

import pytest
import requests
import os
import sys

# Add backend to path for direct imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestWhatsAppStatus:
    """Test WhatsApp status endpoint"""
    
    def test_whatsapp_status_endpoint(self):
        """Test /api/whatsapp/status returns proper configuration status"""
        response = requests.get(f"{BASE_URL}/api/whatsapp/status")
        assert response.status_code == 200
        
        data = response.json()
        # Verify response structure
        assert "configured" in data
        assert "webhook_verify_token" in data
        assert "setup_required" in data
        
        # Since WhatsApp is not configured, verify setup instructions are provided
        if not data["configured"]:
            assert data["setup_required"] == True
            assert "setup_instructions" in data
            assert isinstance(data["setup_instructions"], dict)


class TestWhatsAppWebhookVerification:
    """Test WhatsApp webhook verification endpoint"""
    
    def test_webhook_verification_success(self):
        """Test webhook verification with correct token"""
        params = {
            "hub.mode": "subscribe",
            "hub.verify_token": "doggy_company_webhook_verify_2025",
            "hub.challenge": "12345"
        }
        response = requests.get(f"{BASE_URL}/api/whatsapp/webhook", params=params)
        assert response.status_code == 200
        # Should return the challenge as integer
        assert response.text == "12345"
    
    def test_webhook_verification_failure(self):
        """Test webhook verification with wrong token"""
        params = {
            "hub.mode": "subscribe",
            "hub.verify_token": "wrong_token",
            "hub.challenge": "12345"
        }
        response = requests.get(f"{BASE_URL}/api/whatsapp/webhook", params=params)
        assert response.status_code == 403


class TestMiraWhatsAppPatterns:
    """Test Mira's WhatsApp pattern matching logic directly"""
    
    def test_mira_patterns_import(self):
        """Test that MIRA_WHATSAPP_PATTERNS can be imported"""
        try:
            from whatsapp_routes import MIRA_WHATSAPP_PATTERNS, get_mira_whatsapp_response
            
            # Verify all expected pattern categories exist
            expected_categories = [
                "greeting", "order", "grooming", "vet", "birthday", 
                "stay", "membership", "help", "thanks", "bye"
            ]
            
            for category in expected_categories:
                assert category in MIRA_WHATSAPP_PATTERNS, f"Missing category: {category}"
                assert "patterns" in MIRA_WHATSAPP_PATTERNS[category]
                assert "response" in MIRA_WHATSAPP_PATTERNS[category]
                assert isinstance(MIRA_WHATSAPP_PATTERNS[category]["patterns"], list)
                assert len(MIRA_WHATSAPP_PATTERNS[category]["patterns"]) > 0
                
        except ImportError as e:
            pytest.skip(f"Could not import whatsapp_routes: {e}")
    
    def test_mira_greeting_response(self):
        """Test Mira responds to greetings"""
        import asyncio
        try:
            from whatsapp_routes import get_mira_whatsapp_response
            
            # Test various greetings
            greetings = ["hi", "hello", "hey", "good morning", "namaste"]
            for greeting in greetings:
                response = asyncio.get_event_loop().run_until_complete(
                    get_mira_whatsapp_response(greeting, "Test User")
                )
                assert response is not None
                assert len(response) > 0
                # Greeting response should mention Mira
                assert "Mira" in response or "🐾" in response
                
        except ImportError as e:
            pytest.skip(f"Could not import whatsapp_routes: {e}")
    
    def test_mira_order_response(self):
        """Test Mira responds to order queries"""
        import asyncio
        try:
            from whatsapp_routes import get_mira_whatsapp_response
            
            order_queries = ["I want to order treats", "buy food", "shop for my dog"]
            for query in order_queries:
                response = asyncio.get_event_loop().run_until_complete(
                    get_mira_whatsapp_response(query, "Test User")
                )
                assert response is not None
                # Order response should include shop link
                assert "shop" in response.lower() or "🛍️" in response
                
        except ImportError as e:
            pytest.skip(f"Could not import whatsapp_routes: {e}")
    
    def test_mira_grooming_response(self):
        """Test Mira responds to grooming queries"""
        import asyncio
        try:
            from whatsapp_routes import get_mira_whatsapp_response
            
            grooming_queries = ["book grooming", "need a bath", "haircut for my dog"]
            for query in grooming_queries:
                response = asyncio.get_event_loop().run_until_complete(
                    get_mira_whatsapp_response(query, "Test User")
                )
                assert response is not None
                # Grooming response should mention spa/grooming
                assert "groom" in response.lower() or "spa" in response.lower() or "✂️" in response
                
        except ImportError as e:
            pytest.skip(f"Could not import whatsapp_routes: {e}")
    
    def test_mira_vet_response(self):
        """Test Mira responds to vet/health queries"""
        import asyncio
        try:
            from whatsapp_routes import get_mira_whatsapp_response
            
            vet_queries = ["vet appointment", "vaccination due", "my dog is sick"]
            for query in vet_queries:
                response = asyncio.get_event_loop().run_until_complete(
                    get_mira_whatsapp_response(query, "Test User")
                )
                assert response is not None
                # Vet response should mention health/vet
                assert "vet" in response.lower() or "health" in response.lower() or "💊" in response
                
        except ImportError as e:
            pytest.skip(f"Could not import whatsapp_routes: {e}")
    
    def test_mira_birthday_response(self):
        """Test Mira responds to birthday queries"""
        import asyncio
        try:
            from whatsapp_routes import get_mira_whatsapp_response
            
            birthday_queries = ["birthday party", "need a cake", "celebrate my dog"]
            for query in birthday_queries:
                response = asyncio.get_event_loop().run_until_complete(
                    get_mira_whatsapp_response(query, "Test User")
                )
                assert response is not None
                # Birthday response should mention celebration
                assert "birthday" in response.lower() or "cake" in response.lower() or "🎂" in response
                
        except ImportError as e:
            pytest.skip(f"Could not import whatsapp_routes: {e}")
    
    def test_mira_stay_response(self):
        """Test Mira responds to boarding/stay queries"""
        import asyncio
        try:
            from whatsapp_routes import get_mira_whatsapp_response
            
            stay_queries = ["boarding for my dog", "daycare", "pet hotel"]
            for query in stay_queries:
                response = asyncio.get_event_loop().run_until_complete(
                    get_mira_whatsapp_response(query, "Test User")
                )
                assert response is not None
                # Stay response should mention boarding/stay
                assert "stay" in response.lower() or "boarding" in response.lower() or "🏨" in response
                
        except ImportError as e:
            pytest.skip(f"Could not import whatsapp_routes: {e}")
    
    def test_mira_membership_response(self):
        """Test Mira responds to membership queries"""
        import asyncio
        try:
            from whatsapp_routes import get_mira_whatsapp_response
            
            membership_queries = ["pet pass", "membership", "join"]
            for query in membership_queries:
                response = asyncio.get_event_loop().run_until_complete(
                    get_mira_whatsapp_response(query, "Test User")
                )
                assert response is not None
                # Membership response should mention Pet Pass
                assert "pass" in response.lower() or "member" in response.lower() or "🌟" in response
                
        except ImportError as e:
            pytest.skip(f"Could not import whatsapp_routes: {e}")
    
    def test_mira_help_response(self):
        """Test Mira responds to help queries"""
        import asyncio
        try:
            from whatsapp_routes import get_mira_whatsapp_response
            
            help_queries = ["help", "support", "I have a problem"]
            for query in help_queries:
                response = asyncio.get_event_loop().run_until_complete(
                    get_mira_whatsapp_response(query, "Test User")
                )
                assert response is not None
                # Help response should offer assistance
                assert "help" in response.lower() or "call" in response.lower() or "💜" in response
                
        except ImportError as e:
            pytest.skip(f"Could not import whatsapp_routes: {e}")
    
    def test_mira_default_response(self):
        """Test Mira provides default response for unknown queries"""
        import asyncio
        try:
            from whatsapp_routes import get_mira_whatsapp_response, MIRA_DEFAULT_RESPONSE
            
            unknown_query = "xyzabc random gibberish 12345"
            response = asyncio.get_event_loop().run_until_complete(
                get_mira_whatsapp_response(unknown_query, "Test User")
            )
            assert response is not None
            # Should return default response
            assert response == MIRA_DEFAULT_RESPONSE
                
        except ImportError as e:
            pytest.skip(f"Could not import whatsapp_routes: {e}")
    
    def test_mira_personalization(self):
        """Test Mira personalizes responses with user name"""
        import asyncio
        try:
            from whatsapp_routes import get_mira_whatsapp_response
            
            response = asyncio.get_event_loop().run_until_complete(
                get_mira_whatsapp_response("hello", "Aditya")
            )
            assert response is not None
            # Should personalize with user name
            assert "Aditya" in response
                
        except ImportError as e:
            pytest.skip(f"Could not import whatsapp_routes: {e}")


class TestMiraReplyEndpoint:
    """Test the /api/whatsapp/mira-reply endpoint"""
    
    def test_mira_reply_without_config(self):
        """Test mira-reply returns appropriate response when WhatsApp not configured"""
        # Since WhatsApp is not configured, this should return success=False
        response = requests.post(
            f"{BASE_URL}/api/whatsapp/mira-reply",
            params={"to": "919876543210", "message": "Hello from Mira!"}
        )
        # Should return 200 with success=False (not an error, just not configured)
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == False
        assert "not configured" in data.get("reason", "").lower()


class TestWhatsAppSendEndpoints:
    """Test WhatsApp send endpoints (should fail gracefully when not configured)"""
    
    def test_send_message_not_configured(self):
        """Test /api/whatsapp/send returns error when not configured"""
        response = requests.post(
            f"{BASE_URL}/api/whatsapp/send",
            json={"to": "919876543210", "message": "Test message"}
        )
        # Should return 503 or 520 (cloudflare) when not configured
        assert response.status_code in [503, 520]
        assert "not configured" in response.json().get("detail", "").lower()
    
    def test_send_template_not_configured(self):
        """Test /api/whatsapp/send-template returns error when not configured"""
        response = requests.post(
            f"{BASE_URL}/api/whatsapp/send-template",
            json={"to": "919876543210", "message": "Test", "template_name": "test_template"}
        )
        assert response.status_code in [503, 520]
    
    def test_send_media_not_configured(self):
        """Test /api/whatsapp/send-media returns error when not configured"""
        response = requests.post(
            f"{BASE_URL}/api/whatsapp/send-media",
            json={
                "to": "919876543210",
                "media_type": "image",
                "media_url": "https://example.com/image.jpg"
            }
        )
        assert response.status_code in [503, 520]
    
    def test_list_templates_not_configured(self):
        """Test /api/whatsapp/templates returns error when not configured"""
        response = requests.get(f"{BASE_URL}/api/whatsapp/templates")
        assert response.status_code in [503, 520]


class TestWhatsAppWebhookPost:
    """Test WhatsApp webhook POST endpoint for incoming messages"""
    
    def test_webhook_post_empty_body(self):
        """Test webhook handles empty body gracefully"""
        response = requests.post(
            f"{BASE_URL}/api/whatsapp/webhook",
            json={}
        )
        # Should return 200 to acknowledge receipt
        assert response.status_code == 200
        assert response.json().get("status") == "ok"
    
    def test_webhook_post_with_entry(self):
        """Test webhook handles entry structure"""
        payload = {
            "entry": [
                {
                    "changes": [
                        {
                            "value": {
                                "messages": [],
                                "statuses": []
                            }
                        }
                    ]
                }
            ]
        }
        response = requests.post(
            f"{BASE_URL}/api/whatsapp/webhook",
            json=payload
        )
        assert response.status_code == 200


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
