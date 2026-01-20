"""
Emergency Pillar API Tests
Tests for Emergency pillar backend routes including:
- Emergency config and types
- Emergency vets/partners
- Emergency products
- Emergency bundles
- Admin stats and settings
- Emergency request creation
"""

import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestEmergencyConfig:
    """Tests for Emergency configuration endpoints"""
    
    def test_get_emergency_config(self):
        """Test GET /api/emergency/config returns pillar configuration"""
        response = requests.get(f"{BASE_URL}/api/emergency/config")
        assert response.status_code == 200
        
        data = response.json()
        assert "emergency_types" in data
        assert "severity_levels" in data
        assert "partner_count" in data
        assert "product_count" in data
        assert "enabled" in data
        assert "hotline" in data
        
        # Verify 8 emergency types
        assert len(data["emergency_types"]) == 8
        expected_types = ["lost_pet", "medical_emergency", "accident_injury", "poisoning", 
                        "breathing_distress", "found_pet", "natural_disaster", "aggressive_animal"]
        for etype in expected_types:
            assert etype in data["emergency_types"]
        
        # Verify hotline number
        assert data["hotline"] == "+91 96631 85747"
        
    def test_get_emergency_types(self):
        """Test GET /api/emergency/types returns emergency types and severity levels"""
        response = requests.get(f"{BASE_URL}/api/emergency/types")
        assert response.status_code == 200
        
        data = response.json()
        assert "emergency_types" in data
        assert "severity_levels" in data
        
        # Verify severity levels
        assert len(data["severity_levels"]) == 4
        severity_ids = [s["id"] for s in data["severity_levels"]]
        assert "critical" in severity_ids
        assert "urgent" in severity_ids
        assert "high" in severity_ids
        assert "moderate" in severity_ids


class TestEmergencyPartners:
    """Tests for Emergency partners/vets endpoints"""
    
    def test_get_emergency_vets(self):
        """Test GET /api/emergency/vets returns emergency vet partners"""
        response = requests.get(f"{BASE_URL}/api/emergency/vets")
        assert response.status_code == 200
        
        data = response.json()
        assert "vets" in data
        assert "total" in data
        assert data["total"] >= 4  # Seeded with 4 partners
        
        # Verify partner structure
        if data["vets"]:
            vet = data["vets"][0]
            assert "id" in vet
            assert "name" in vet
            assert "partner_type" in vet
            assert "is_24hr" in vet
            assert "rating" in vet
            
    def test_get_emergency_vets_24hr_filter(self):
        """Test GET /api/emergency/vets with 24hr filter"""
        response = requests.get(f"{BASE_URL}/api/emergency/vets?is_24hr=true")
        assert response.status_code == 200
        
        data = response.json()
        assert data["total"] >= 3  # 3 partners are 24/7
        
        # All returned vets should be 24hr
        for vet in data["vets"]:
            assert vet["is_24hr"] == True
            
    def test_get_admin_partners(self):
        """Test GET /api/emergency/admin/partners returns all partners"""
        response = requests.get(f"{BASE_URL}/api/emergency/admin/partners")
        assert response.status_code == 200
        
        data = response.json()
        assert "partners" in data
        assert "total" in data
        assert data["total"] == 4  # Exactly 4 seeded partners
        
        # Verify partner types
        partner_types = [p["partner_type"] for p in data["partners"]]
        assert "emergency_vet" in partner_types
        assert "ambulance" in partner_types
        assert "shelter" in partner_types
        assert "helpline" in partner_types


class TestEmergencyProducts:
    """Tests for Emergency products endpoints"""
    
    def test_get_emergency_products(self):
        """Test GET /api/emergency/products returns emergency products"""
        response = requests.get(f"{BASE_URL}/api/emergency/products")
        assert response.status_code == 200
        
        data = response.json()
        assert "products" in data
        assert "total" in data
        assert data["total"] == 12  # Exactly 12 seeded products
        
        # Verify product structure
        if data["products"]:
            product = data["products"][0]
            assert "id" in product
            assert "name" in product
            assert "price" in product
            assert "category" in product
            assert product["category"] == "emergency"
            assert "paw_reward_points" in product
            
    def test_emergency_products_have_required_fields(self):
        """Test that all emergency products have required fields"""
        response = requests.get(f"{BASE_URL}/api/emergency/products")
        assert response.status_code == 200
        
        data = response.json()
        for product in data["products"]:
            assert "id" in product
            assert "name" in product
            assert "description" in product
            assert "price" in product
            assert "in_stock" in product
            assert "pet_sizes" in product


class TestEmergencyBundles:
    """Tests for Emergency bundles endpoints"""
    
    def test_get_emergency_bundles(self):
        """Test GET /api/emergency/bundles returns emergency bundles"""
        response = requests.get(f"{BASE_URL}/api/emergency/bundles")
        assert response.status_code == 200
        
        data = response.json()
        assert "bundles" in data
        assert "total" in data
        assert data["total"] == 5  # Exactly 5 seeded bundles
        
        # Verify bundle structure
        if data["bundles"]:
            bundle = data["bundles"][0]
            assert "id" in bundle
            assert "name" in bundle
            assert "price" in bundle
            assert "original_price" in bundle
            assert "items" in bundle
            assert "paw_reward_points" in bundle
            
    def test_emergency_bundles_have_savings(self):
        """Test that bundles have savings (price < original_price)"""
        response = requests.get(f"{BASE_URL}/api/emergency/bundles")
        assert response.status_code == 200
        
        data = response.json()
        for bundle in data["bundles"]:
            assert bundle["price"] < bundle["original_price"], f"Bundle {bundle['name']} should have savings"


class TestEmergencyAdminStats:
    """Tests for Emergency admin statistics"""
    
    def test_get_admin_stats(self):
        """Test GET /api/emergency/admin/stats returns statistics"""
        response = requests.get(f"{BASE_URL}/api/emergency/admin/stats")
        assert response.status_code == 200
        
        data = response.json()
        
        # Verify request stats
        assert "total_requests" in data
        assert "active_requests" in data
        assert "responding_requests" in data
        assert "resolved_requests" in data
        
        # Verify breakdown stats
        assert "by_type" in data
        assert "by_severity" in data
        
        # Verify resource counts
        assert "total_partners" in data
        assert "total_products" in data
        assert "total_bundles" in data
        
        # Verify counts match seeded data
        assert data["total_partners"] == 4
        assert data["total_products"] == 12
        assert data["total_bundles"] == 5
        
    def test_admin_stats_type_breakdown(self):
        """Test that stats include all 8 emergency types"""
        response = requests.get(f"{BASE_URL}/api/emergency/admin/stats")
        assert response.status_code == 200
        
        data = response.json()
        expected_types = ["lost_pet", "medical_emergency", "accident_injury", "poisoning", 
                        "breathing_distress", "found_pet", "natural_disaster", "aggressive_animal"]
        
        for etype in expected_types:
            assert etype in data["by_type"]


class TestEmergencyAdminSettings:
    """Tests for Emergency admin settings"""
    
    def test_get_admin_settings(self):
        """Test GET /api/emergency/admin/settings returns settings"""
        response = requests.get(f"{BASE_URL}/api/emergency/admin/settings")
        assert response.status_code == 200
        
        data = response.json()
        
        # Verify settings sections
        assert "response_settings" in data
        assert "notifications" in data
        assert "lost_pet_settings" in data
        assert "service_desk" in data
        
    def test_response_settings_structure(self):
        """Test response settings have SLA configurations"""
        response = requests.get(f"{BASE_URL}/api/emergency/admin/settings")
        assert response.status_code == 200
        
        data = response.json()
        response_settings = data["response_settings"]
        
        assert "critical_sla_minutes" in response_settings
        assert "urgent_sla_minutes" in response_settings
        assert "auto_escalate" in response_settings
        
    def test_notification_settings_structure(self):
        """Test notification settings have all channels"""
        response = requests.get(f"{BASE_URL}/api/emergency/admin/settings")
        assert response.status_code == 200
        
        data = response.json()
        notifications = data["notifications"]
        
        assert "email_enabled" in notifications
        assert "sms_enabled" in notifications
        assert "whatsapp_enabled" in notifications
        assert "sound_alerts" in notifications
        
    def test_lost_pet_settings_structure(self):
        """Test lost pet settings have required fields"""
        response = requests.get(f"{BASE_URL}/api/emergency/admin/settings")
        assert response.status_code == 200
        
        data = response.json()
        lost_pet = data["lost_pet_settings"]
        
        assert "auto_create_alert" in lost_pet
        assert "alert_radius_km" in lost_pet
        assert "include_nearby_vets" in lost_pet
        assert "include_nearby_shelters" in lost_pet


class TestEmergencyRequests:
    """Tests for Emergency request endpoints"""
    
    def test_get_emergency_requests(self):
        """Test GET /api/emergency/requests returns requests list"""
        response = requests.get(f"{BASE_URL}/api/emergency/requests")
        assert response.status_code == 200
        
        data = response.json()
        assert "requests" in data
        assert "total" in data
        
    def test_create_emergency_request(self):
        """Test POST /api/emergency/request creates a new emergency"""
        test_request = {
            "emergency_type": "medical_emergency",
            "severity": "urgent",
            "pet_name": "TEST_Emergency_Dog",
            "pet_breed": "Golden Retriever",
            "pet_species": "dog",
            "user_name": "Test User",
            "user_email": "test@example.com",
            "user_phone": "+91 98765 12345",
            "location": "Test Location, Mumbai",
            "city": "Mumbai",
            "description": "TEST: This is a test emergency request for automated testing"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/emergency/request",
            json=test_request
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "message" in data
        assert "request_id" in data
        assert "ticket_id" in data
        assert data["request_id"].startswith("EMRG-")
        
        # Verify request was created
        request_id = data["request_id"]
        get_response = requests.get(f"{BASE_URL}/api/emergency/requests/{request_id}")
        assert get_response.status_code == 200
        
        created_request = get_response.json()
        assert created_request["pet_name"] == "TEST_Emergency_Dog"
        assert created_request["emergency_type"] == "medical_emergency"
        assert created_request["status"] == "active"
        
    def test_update_emergency_request_status(self):
        """Test PUT /api/emergency/requests/{id} updates request status"""
        # First create a request
        test_request = {
            "emergency_type": "lost_pet",
            "severity": "high",
            "pet_name": "TEST_Lost_Cat",
            "pet_breed": "Persian",
            "pet_species": "cat",
            "user_name": "Test User 2",
            "user_email": "test2@example.com",
            "user_phone": "+91 98765 54321",
            "location": "Test Location 2, Delhi",
            "city": "Delhi",
            "description": "TEST: Lost pet request for status update testing"
        }
        
        create_response = requests.post(f"{BASE_URL}/api/emergency/request", json=test_request)
        assert create_response.status_code == 200
        request_id = create_response.json()["request_id"]
        
        # Update status to responding
        update_response = requests.put(
            f"{BASE_URL}/api/emergency/requests/{request_id}",
            json={"status": "responding"}
        )
        assert update_response.status_code == 200
        
        # Verify status was updated
        get_response = requests.get(f"{BASE_URL}/api/emergency/requests/{request_id}")
        assert get_response.status_code == 200
        assert get_response.json()["status"] == "responding"
        assert get_response.json()["response_started_at"] is not None


class TestEmergencyContacts:
    """Tests for Emergency contacts endpoints"""
    
    def test_create_and_get_emergency_contact(self):
        """Test creating and retrieving emergency contacts"""
        test_pet_id = f"test-pet-{uuid.uuid4().hex[:8]}"
        
        contact_data = {
            "pet_id": test_pet_id,
            "user_id": "test-user-123",
            "contact_type": "emergency_contact",
            "name": "TEST Emergency Contact",
            "phone": "+91 98765 00000",
            "email": "emergency@test.com",
            "relationship": "Neighbor",
            "can_make_decisions": True
        }
        
        # Create contact
        create_response = requests.post(f"{BASE_URL}/api/emergency/contacts", json=contact_data)
        assert create_response.status_code == 200
        
        data = create_response.json()
        assert "contact_id" in data
        assert data["contact_id"].startswith("EMRG-CONTACT-")
        
        # Get contacts for pet
        get_response = requests.get(f"{BASE_URL}/api/emergency/contacts/{test_pet_id}")
        assert get_response.status_code == 200
        
        contacts = get_response.json()
        assert "contacts" in contacts
        assert len(contacts["contacts"]) >= 1
        
        # Verify contact data
        created_contact = next((c for c in contacts["contacts"] if c["name"] == "TEST Emergency Contact"), None)
        assert created_contact is not None
        assert created_contact["phone"] == "+91 98765 00000"


class TestEmergencyPartnerCRUD:
    """Tests for Emergency partner CRUD operations"""
    
    def test_create_partner(self):
        """Test POST /api/emergency/admin/partners creates a partner"""
        partner_data = {
            "name": "TEST Emergency Clinic",
            "partner_type": "emergency_vet",
            "description": "Test clinic for automated testing",
            "cities": ["Mumbai"],
            "phone": "+91 98765 99999",
            "emergency_phone": "+91 98765 99999",
            "email": "test@clinic.com",
            "is_24hr": True,
            "services": ["emergency_surgery", "icu"],
            "rating": 4.5
        }
        
        response = requests.post(f"{BASE_URL}/api/emergency/admin/partners", json=partner_data)
        assert response.status_code == 200
        
        data = response.json()
        assert "partner_id" in data
        assert data["partner_id"].startswith("emrg-partner-")
        
    def test_update_partner(self):
        """Test PUT /api/emergency/admin/partners/{id} updates a partner"""
        # Use existing partner
        partners_response = requests.get(f"{BASE_URL}/api/emergency/admin/partners")
        partners = partners_response.json()["partners"]
        
        if partners:
            partner_id = partners[0]["id"]
            update_response = requests.put(
                f"{BASE_URL}/api/emergency/admin/partners/{partner_id}",
                json={"rating": 4.95}
            )
            assert update_response.status_code == 200


class TestEmergencyProductCRUD:
    """Tests for Emergency product CRUD operations"""
    
    def test_create_product(self):
        """Test POST /api/emergency/admin/products creates a product"""
        product_data = {
            "name": "TEST Emergency Product",
            "description": "Test product for automated testing",
            "price": 999,
            "compare_price": 1299,
            "product_type": "first_aid",
            "tags": ["test", "emergency"],
            "pet_sizes": ["small", "medium", "large"],
            "in_stock": True,
            "paw_reward_points": 15
        }
        
        response = requests.post(f"{BASE_URL}/api/emergency/admin/products", json=product_data)
        assert response.status_code == 200
        
        data = response.json()
        assert "product_id" in data
        assert data["product_id"].startswith("emrg-")


class TestEmergencyBundleCRUD:
    """Tests for Emergency bundle CRUD operations"""
    
    def test_create_bundle(self):
        """Test POST /api/emergency/admin/bundles creates a bundle"""
        bundle_data = {
            "name": "TEST Emergency Bundle",
            "description": "Test bundle for automated testing",
            "items": ["emrg-first-aid-kit", "emrg-gps-tracker"],
            "price": 3999,
            "original_price": 4498,
            "paw_reward_points": 60,
            "is_recommended": False
        }
        
        response = requests.post(f"{BASE_URL}/api/emergency/admin/bundles", json=bundle_data)
        assert response.status_code == 200
        
        data = response.json()
        assert "bundle_id" in data
        assert data["bundle_id"].startswith("emrg-bundle-")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
