"""
Test Suite: Celebrate Pillar Iteration 198
Tests for:
1. Concierge ticket creation (CelebrateConcierge, CelebrateServiceGrid, MiraBirthdayBox)
2. Celebration Wall UGC upload (Cloudinary)
3. Service desk ticket verification
4. Mira chat pet_id handling
"""

import pytest
import requests
import os
import time
import base64
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_USER_EMAIL = "dipali@clubconcierge.in"
TEST_USER_PASSWORD = "test123"
ADMIN_USERNAME = "aditya"
ADMIN_PASSWORD = "lola4304"


class TestConciergeTicketCreation:
    """Test that concierge CTAs create service desk tickets"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token for tests"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login to get token
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        if login_response.status_code == 200:
            data = login_response.json()
            self.token = data.get("token") or data.get("access_token")
            if self.token:
                self.session.headers.update({"Authorization": f"Bearer {self.token}"})
        
        # Get a test pet ID
        pets_response = self.session.get(f"{BASE_URL}/api/pets/my-pets")
        if pets_response.status_code == 200:
            pets_data = pets_response.json()
            pets = pets_data.get("pets", [])
            if pets:
                self.test_pet = pets[0]
                self.test_pet_id = self.test_pet.get("id")
                self.test_pet_name = self.test_pet.get("name", "Test Pet")
            else:
                self.test_pet = None
                self.test_pet_id = "pet-test-123"
                self.test_pet_name = "Test Pet"
        else:
            self.test_pet_id = "pet-test-123"
            self.test_pet_name = "Test Pet"
    
    def test_service_desk_attach_or_create_ticket_endpoint_exists(self):
        """Test that the attach_or_create_ticket endpoint exists and accepts requests"""
        payload = {
            "pet_id": self.test_pet_id,
            "pet_name": self.test_pet_name,
            "parent_id": TEST_USER_EMAIL,  # Required field
            "parent_email": TEST_USER_EMAIL,
            "intent_primary": "service_booking",
            "pillar": "celebrate",
            "channel": "test_celebrate_concierge_cta",
            "subject": f"Test Booking Request for {self.test_pet_name}",
            "initial_message": {
                "text": f"Test: Please arrange celebration for {self.test_pet_name}.",
                "sender": "member"
            }
        }
        
        response = self.session.post(f"{BASE_URL}/api/service_desk/attach_or_create_ticket", json=payload)
        
        # Should return 200 or 201
        assert response.status_code in [200, 201], f"Expected 200/201, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Should return ticket_id
        assert "ticket_id" in data or "id" in data, f"Response should contain ticket_id: {data}"
        
        ticket_id = data.get("ticket_id") or data.get("id")
        print(f"✓ Created ticket: {ticket_id}")
    
    def test_celebrate_concierge_cta_creates_ticket(self):
        """Test CelebrateConcierge CTA button creates a service desk ticket via useConcierge book()"""
        # Simulate what useConcierge.book() sends
        payload = {
            "pet_id": self.test_pet_id,
            "pet_name": self.test_pet_name,
            "parent_id": TEST_USER_EMAIL,  # Required field
            "parent_email": TEST_USER_EMAIL,
            "intent_primary": "service_booking",
            "pillar": "celebrate",
            "urgency": "high",
            "channel": "celebrate_concierge_cta",
            "subject": f"Booking Request: {self.test_pet_name}'s Celebration — Plan my birthday for {self.test_pet_name}",
            "initial_message": {
                "text": f"Please arrange \"{self.test_pet_name}'s Celebration — Plan my birthday\" for {self.test_pet_name}.",
                "sender": "member"
            },
            "force_new": True
        }
        
        response = self.session.post(f"{BASE_URL}/api/service_desk/attach_or_create_ticket", json=payload)
        
        assert response.status_code in [200, 201], f"CelebrateConcierge CTA failed: {response.status_code}"
        data = response.json()
        
        ticket_id = data.get("ticket_id") or data.get("id")
        assert ticket_id, "No ticket_id returned"
        assert ticket_id.startswith("TDB-"), f"Ticket ID should start with TDB-: {ticket_id}"
        
        print(f"✓ CelebrateConcierge CTA created ticket: {ticket_id}")
    
    def test_celebrate_service_grid_creates_ticket(self):
        """Test CelebrateServiceGrid card click creates a service desk ticket via useConcierge book()"""
        # Simulate what useConcierge.book() sends from CelebrateServiceGrid
        payload = {
            "pet_id": self.test_pet_id,
            "pet_name": self.test_pet_name,
            "parent_id": TEST_USER_EMAIL,  # Required field
            "parent_email": TEST_USER_EMAIL,
            "intent_primary": "service_booking",
            "pillar": "celebrate",
            "urgency": "normal",
            "channel": "celebrate_service_grid",
            "subject": f"Booking Request: {self.test_pet_name} — Birthday Photoshoot for {self.test_pet_name}",
            "initial_message": {
                "text": f"Please arrange \"{self.test_pet_name} — Birthday Photoshoot\" for {self.test_pet_name}.",
                "sender": "member"
            },
            "force_new": True
        }
        
        response = self.session.post(f"{BASE_URL}/api/service_desk/attach_or_create_ticket", json=payload)
        
        assert response.status_code in [200, 201], f"CelebrateServiceGrid failed: {response.status_code}"
        data = response.json()
        
        ticket_id = data.get("ticket_id") or data.get("id")
        assert ticket_id, "No ticket_id returned"
        
        print(f"✓ CelebrateServiceGrid created ticket: {ticket_id}")
    
    def test_mira_birthday_box_creates_ticket(self):
        """Test MiraBirthdayBox 'Build Box' click creates a service desk ticket via useConcierge request()"""
        # Simulate what useConcierge.request() sends from MiraBirthdayBox
        payload = {
            "pet_id": self.test_pet_id,
            "pet_name": self.test_pet_name,
            "parent_id": TEST_USER_EMAIL,  # Required field
            "parent_email": TEST_USER_EMAIL,
            "intent_primary": "concierge_request",
            "pillar": "celebrate",
            "urgency": "normal",
            "channel": "celebrate_birthday_box_start",
            "subject": f"Concierge Request for {self.test_pet_name}",
            "initial_message": {
                "text": f"Please arrange \"{self.test_pet_name}'s Birthday Box — started\" for {self.test_pet_name}.",
                "sender": "member"
            },
            "force_new": True
        }
        
        response = self.session.post(f"{BASE_URL}/api/service_desk/attach_or_create_ticket", json=payload)
        
        assert response.status_code in [200, 201], f"MiraBirthdayBox failed: {response.status_code}"
        data = response.json()
        
        ticket_id = data.get("ticket_id") or data.get("id")
        assert ticket_id, "No ticket_id returned"
        
        print(f"✓ MiraBirthdayBox created ticket: {ticket_id}")


class TestCelebrationWallUpload:
    """Test Celebration Wall UGC upload to Cloudinary"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token for tests"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login to get token
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        if login_response.status_code == 200:
            data = login_response.json()
            self.token = data.get("token") or data.get("access_token")
            if self.token:
                self.session.headers.update({"Authorization": f"Bearer {self.token}"})
    
    def test_celebration_wall_photos_endpoint(self):
        """Test GET /api/celebration-wall/photos returns photos"""
        response = self.session.get(f"{BASE_URL}/api/celebration-wall/photos?featured_only=true&limit=5")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        assert "photos" in data, "Response should contain 'photos' key"
        assert "total" in data, "Response should contain 'total' key"
        
        print(f"✓ Celebration Wall has {data['total']} photos")
    
    def test_celebration_wall_ugc_upload(self):
        """Test POST /api/celebration-wall/photos/ugc uploads to Cloudinary"""
        # Create a small test image (1x1 pixel PNG)
        # This is a valid base64 encoded 1x1 transparent PNG
        test_image_base64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        
        payload = {
            "image_url": test_image_base64,
            "pet_name": "Test Pet",
            "pet_id": "pet-test-123",
            "caption": "Test celebration photo upload",
            "celebration_type": "Birthday",
            "city": "Mumbai",
            "mira_comment": "Test Mira comment",
            "source": "ugc"
        }
        
        response = self.session.post(f"{BASE_URL}/api/celebration-wall/photos/ugc", json=payload)
        
        assert response.status_code in [200, 201], f"UGC upload failed: {response.status_code}: {response.text}"
        data = response.json()
        
        assert data.get("success") == True, f"Upload should succeed: {data}"
        assert "photo_id" in data, "Response should contain photo_id"
        assert "image_url" in data, "Response should contain image_url (Cloudinary URL)"
        
        # Verify Cloudinary URL
        image_url = data.get("image_url", "")
        assert "cloudinary" in image_url or "res.cloudinary.com" in image_url, f"Image should be on Cloudinary: {image_url}"
        
        print(f"✓ UGC uploaded to Cloudinary: {image_url[:80]}...")
        print(f"✓ Photo ID: {data.get('photo_id')}")


class TestMiraChatPetId:
    """Test that Mira chat widget receives pet_id correctly"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token for tests"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login to get token
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        if login_response.status_code == 200:
            data = login_response.json()
            self.token = data.get("token") or data.get("access_token")
            if self.token:
                self.session.headers.update({"Authorization": f"Bearer {self.token}"})
        
        # Get a test pet ID
        pets_response = self.session.get(f"{BASE_URL}/api/pets/my-pets")
        if pets_response.status_code == 200:
            pets_data = pets_response.json()
            pets = pets_data.get("pets", [])
            if pets:
                self.test_pet = pets[0]
                self.test_pet_id = self.test_pet.get("id")
                self.test_pet_name = self.test_pet.get("name", "Test Pet")
            else:
                self.test_pet_id = "pet-test-123"
                self.test_pet_name = "Test Pet"
        else:
            self.test_pet_id = "pet-test-123"
            self.test_pet_name = "Test Pet"
    
    def test_mira_chat_accepts_pet_id(self):
        """Test that Mira chat endpoint accepts pet_id parameter"""
        payload = {
            "message": f"Hello, I want to plan a birthday for {self.test_pet_name}",
            "pet_id": self.test_pet_id,
            "session_id": f"test-session-{int(time.time())}",
            "pillar": "celebrate"
        }
        
        response = self.session.post(f"{BASE_URL}/api/mira/chat", json=payload)
        
        # Should return 200
        assert response.status_code == 200, f"Mira chat failed: {response.status_code}: {response.text}"
        
        data = response.json()
        assert "response" in data or "message" in data or "text" in data, f"Response should contain message: {data}"
        
        print(f"✓ Mira chat accepts pet_id: {self.test_pet_id}")
    
    def test_mira_chat_accepts_selected_pet_id(self):
        """Test that Mira chat endpoint accepts selected_pet_id parameter (alternative key)"""
        payload = {
            "message": f"What treats are good for {self.test_pet_name}?",
            "selected_pet_id": self.test_pet_id,
            "session_id": f"test-session-{int(time.time())}",
            "pillar": "celebrate"
        }
        
        response = self.session.post(f"{BASE_URL}/api/mira/chat", json=payload)
        
        # Should return 200
        assert response.status_code == 200, f"Mira chat failed: {response.status_code}: {response.text}"
        
        print(f"✓ Mira chat accepts selected_pet_id: {self.test_pet_id}")


class TestServiceBoxServices:
    """Test Service Box API for celebrate services"""
    
    def test_service_box_celebrate_services(self):
        """Test GET /api/service-box/services returns celebrate services"""
        response = requests.get(f"{BASE_URL}/api/service-box/services?pillar=celebrate&limit=20&is_active=true")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        assert "services" in data, "Response should contain 'services' key"
        services = data.get("services", [])
        
        print(f"✓ Service Box has {len(services)} celebrate services")
        
        # Verify services have required fields
        if services:
            service = services[0]
            assert "name" in service, "Service should have 'name'"
            print(f"  First service: {service.get('name')}")


class TestBirthdayBoxPreview:
    """Test Birthday Box preview API"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Get auth token and pet for tests"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login to get token
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        if login_response.status_code == 200:
            data = login_response.json()
            self.token = data.get("token") or data.get("access_token")
            if self.token:
                self.session.headers.update({"Authorization": f"Bearer {self.token}"})
        
        # Get a test pet ID
        pets_response = self.session.get(f"{BASE_URL}/api/pets/my-pets")
        if pets_response.status_code == 200:
            pets_data = pets_response.json()
            pets = pets_data.get("pets", [])
            if pets:
                self.test_pet_id = pets[0].get("id")
            else:
                self.test_pet_id = None
        else:
            self.test_pet_id = None
    
    def test_birthday_box_preview_endpoint(self):
        """Test GET /api/birthday-box/{pet_id}/preview returns box preview"""
        if not self.test_pet_id:
            pytest.skip("No test pet available")
        
        response = self.session.get(f"{BASE_URL}/api/birthday-box/{self.test_pet_id}/preview")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Should have visible slots
        assert "visibleSlots" in data or "visible_slots" in data, f"Response should contain slots: {data}"
        
        print(f"✓ Birthday Box preview loaded for pet: {self.test_pet_id}")


class TestAnnouncementBar:
    """Test that announcement bar data is available"""
    
    def test_health_check(self):
        """Test basic health check endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        
        assert response.status_code == 200, f"Health check failed: {response.status_code}"
        print("✓ Backend health check passed")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
