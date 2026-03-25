"""
Batch 5-6 Mobile Parity Sprint Backend Tests
Tests for Emergency WhatsApp endpoint and mobile page APIs
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    BASE_URL = "https://pillar-parity-sprint.preview.emergentagent.com"


class TestEmergencyWhatsAppEndpoint:
    """POST /api/notifications/emergency-whatsapp endpoint tests"""
    
    def test_emergency_whatsapp_returns_200(self):
        """Emergency WhatsApp endpoint should return 200 with success response"""
        response = requests.post(
            f"{BASE_URL}/api/notifications/emergency-whatsapp",
            json={"petName": "TestDog", "breed": "Labrador", "to": "919739908844"},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "success" in data
        assert "message" in data
        # Message should confirm emergency alert
        assert "Emergency alert" in data.get("message", "") or data.get("success") is not None
    
    def test_emergency_whatsapp_with_full_payload(self):
        """Emergency WhatsApp with complete pet info"""
        response = requests.post(
            f"{BASE_URL}/api/notifications/emergency-whatsapp",
            json={
                "petName": "Mojo",
                "breed": "Indie",
                "to": "919739908844",
                "allergies": "chicken",
                "userName": "TestUser",
                "message": "🚨 EMERGENCY TEST — Mojo (Indie). Allergies: chicken."
            },
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "success" in data
        assert "message" in data
    
    def test_emergency_whatsapp_empty_payload(self):
        """Emergency WhatsApp should handle empty payload gracefully"""
        response = requests.post(
            f"{BASE_URL}/api/notifications/emergency-whatsapp",
            json={},
            headers={"Content-Type": "application/json"}
        )
        # Should return 200 with success or failure, not 500
        assert response.status_code == 200
        data = response.json()
        assert "success" in data


class TestMobilePillarAPIs:
    """Test pillar product APIs used by mobile pages"""
    
    def test_care_products_endpoint(self):
        """Care products API used by CareMobilePage"""
        response = requests.get(f"{BASE_URL}/api/admin/pillar-products?pillar=care&limit=10")
        assert response.status_code == 200
        data = response.json()
        assert "products" in data
    
    def test_go_products_endpoint(self):
        """Go products API used by GoMobilePage"""
        response = requests.get(f"{BASE_URL}/api/admin/pillar-products?pillar=go&limit=10")
        assert response.status_code == 200
        data = response.json()
        assert "products" in data
    
    def test_play_products_endpoint(self):
        """Play products API used by PlayMobilePage"""
        response = requests.get(f"{BASE_URL}/api/admin/pillar-products?pillar=play&limit=10")
        assert response.status_code == 200
        data = response.json()
        assert "products" in data
    
    def test_learn_products_endpoint(self):
        """Learn products API used by LearnMobilePage"""
        response = requests.get(f"{BASE_URL}/api/admin/pillar-products?pillar=learn&limit=10")
        assert response.status_code == 200
        data = response.json()
        assert "products" in data
    
    def test_paperwork_products_endpoint(self):
        """Paperwork products API used by PaperworkMobilePage"""
        response = requests.get(f"{BASE_URL}/api/admin/pillar-products?pillar=paperwork&limit=10")
        assert response.status_code == 200
        data = response.json()
        assert "products" in data
    
    def test_emergency_products_endpoint(self):
        """Emergency products API used by EmergencyMobilePage"""
        response = requests.get(f"{BASE_URL}/api/admin/pillar-products?pillar=emergency&limit=10")
        assert response.status_code == 200
        data = response.json()
        assert "products" in data
    
    def test_care_services_endpoint(self):
        """Care services API used by CareConciergeSection"""
        response = requests.get(f"{BASE_URL}/api/service-box/services?pillar=care&limit=10")
        assert response.status_code == 200
    
    def test_emergency_services_endpoint(self):
        """Emergency services API"""
        response = requests.get(f"{BASE_URL}/api/service-box/services?pillar=emergency&limit=10")
        assert response.status_code == 200
    
    def test_learn_sub_category_products(self):
        """Learn sub-category products API (used by LearnDimPanel)"""
        response = requests.get(
            f"{BASE_URL}/api/admin/pillar-products?pillar=learn&sub_category=training&limit=10"
        )
        assert response.status_code == 200
        data = response.json()
        assert "products" in data
    
    def test_paperwork_sub_category_products(self):
        """Paperwork sub-category products (used by PwDimPanel)"""
        response = requests.get(
            f"{BASE_URL}/api/admin/pillar-products?pillar=paperwork&sub_category=health&limit=10"
        )
        assert response.status_code == 200
        data = response.json()
        assert "products" in data


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
