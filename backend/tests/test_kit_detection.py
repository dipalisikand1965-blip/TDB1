"""
Test Kit Detection Fix - Iteration 160
Tests that kit detection prioritizes CURRENT message over history
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://soul-made-products.preview.emergentagent.com')

class TestKitDetection:
    """Test kit detection prioritizes current message over history"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token"""
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "dipali@clubconcierge.in",
            "password": "test123"
        })
        assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
        self.token = login_resp.json().get("access_token")
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_training_kit_on_learn_page(self):
        """Test: Training kit request on Learn page should return training_kit type"""
        response = requests.post(f"{BASE_URL}/api/mira/chat",
            headers=self.headers,
            json={
                "message": "build me a training kit",
                "current_pillar": "learn",
                "history": []
            }
        )
        
        assert response.status_code == 200, f"API failed: {response.text}"
        data = response.json()
        
        # Verify kit_type is training_kit
        kit_assembly = data.get("kit_assembly", {})
        kit_type = kit_assembly.get("kit_type")
        
        assert kit_type == "training_kit", f"Expected training_kit, got {kit_type}"
        print(f"✅ Training kit on Learn page: kit_type={kit_type}")
    
    def test_travel_kit_on_travel_page(self):
        """Test: Travel kit request on Travel page should return travel_kit type"""
        response = requests.post(f"{BASE_URL}/api/mira/chat",
            headers=self.headers,
            json={
                "message": "build me a travel kit",
                "current_pillar": "travel",
                "history": []
            }
        )
        
        assert response.status_code == 200, f"API failed: {response.text}"
        data = response.json()
        
        # Verify kit_type is travel_kit
        kit_assembly = data.get("kit_assembly", {})
        kit_type = kit_assembly.get("kit_type")
        
        assert kit_type == "travel_kit", f"Expected travel_kit, got {kit_type}"
        print(f"✅ Travel kit on Travel page: kit_type={kit_type}")
    
    def test_training_kit_with_travel_history(self):
        """CRITICAL: Training kit request should NOT be affected by travel history"""
        response = requests.post(f"{BASE_URL}/api/mira/chat",
            headers=self.headers,
            json={
                "message": "build me a training kit",
                "current_pillar": "learn",
                "history": [
                    {"role": "user", "content": "I want to travel to Goa with my dog"},
                    {"role": "assistant", "content": "Great! Goa is pet-friendly. Would you like help with travel arrangements?"}
                ]
            }
        )
        
        assert response.status_code == 200, f"API failed: {response.text}"
        data = response.json()
        
        # Verify kit_type is training_kit (NOT travel_kit)
        kit_assembly = data.get("kit_assembly", {})
        kit_type = kit_assembly.get("kit_type")
        
        assert kit_type == "training_kit", f"BUG: Expected training_kit but got {kit_type}. Current message should override history!"
        print(f"✅ Training kit with travel history: kit_type={kit_type} (correctly prioritized current message)")
    
    def test_grooming_kit_on_care_page(self):
        """Test: Grooming kit request on Care page should return grooming_kit type"""
        response = requests.post(f"{BASE_URL}/api/mira/chat",
            headers=self.headers,
            json={
                "message": "build me a grooming kit",
                "current_pillar": "care",
                "history": []
            }
        )
        
        assert response.status_code == 200, f"API failed: {response.text}"
        data = response.json()
        
        # Verify kit_type is grooming_kit
        kit_assembly = data.get("kit_assembly", {})
        kit_type = kit_assembly.get("kit_type")
        
        assert kit_type == "grooming_kit", f"Expected grooming_kit, got {kit_type}"
        print(f"✅ Grooming kit on Care page: kit_type={kit_type}")
    
    def test_birthday_kit_on_celebrate_page(self):
        """Test: Birthday kit request on Celebrate page should return birthday_kit type"""
        response = requests.post(f"{BASE_URL}/api/mira/chat",
            headers=self.headers,
            json={
                "message": "build me a birthday kit for my dog",
                "current_pillar": "celebrate",
                "history": []
            }
        )
        
        assert response.status_code == 200, f"API failed: {response.text}"
        data = response.json()
        
        # Verify kit_type is birthday_kit (if kit_assembly exists)
        kit_assembly = data.get("kit_assembly")
        if kit_assembly:
            kit_type = kit_assembly.get("kit_type")
            assert kit_type == "birthday_kit", f"Expected birthday_kit, got {kit_type}"
            print(f"✅ Birthday kit on Celebrate page: kit_type={kit_type}")
        else:
            # Birthday requests may not trigger kit assembly flow
            # Just verify the response is valid
            assert "response" in data or "message" in data, "Response should have content"
            print(f"✅ Birthday request on Celebrate page: valid response (no kit assembly)")


class TestMiraChatBasics:
    """Basic Mira chat functionality tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token"""
        login_resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "dipali@clubconcierge.in",
            "password": "test123"
        })
        assert login_resp.status_code == 200, f"Login failed: {login_resp.text}"
        self.token = login_resp.json().get("access_token")
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_mira_chat_returns_response(self):
        """Test: Mira chat should return a valid response"""
        response = requests.post(f"{BASE_URL}/api/mira/chat",
            headers=self.headers,
            json={
                "message": "Hello Mira",
                "current_pillar": "advisory",
                "history": []
            }
        )
        
        assert response.status_code == 200, f"API failed: {response.text}"
        data = response.json()
        
        # Verify response has required fields
        assert "response" in data or "message" in data, "Response should have 'response' or 'message' field"
        assert "session_id" in data, "Response should have 'session_id'"
        print(f"✅ Mira chat returns valid response")
    
    def test_mira_chat_creates_ticket(self):
        """Test: Mira chat should create a ticket"""
        response = requests.post(f"{BASE_URL}/api/mira/chat",
            headers=self.headers,
            json={
                "message": "I need help with my dog",
                "current_pillar": "advisory",
                "history": []
            }
        )
        
        assert response.status_code == 200, f"API failed: {response.text}"
        data = response.json()
        
        # Verify ticket_id is returned
        assert "ticket_id" in data, "Response should have 'ticket_id'"
        print(f"✅ Mira chat creates ticket: {data.get('ticket_id')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
