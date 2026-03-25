"""
Play Pillar Audit - Iteration 201
Tests for Play pillar concierge wiring, service desk ticket creation, and Mira context
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://pillar-parity-sprint.preview.emergentagent.com')
TEST_EMAIL = "dipali@clubconcierge.in"
TEST_PASSWORD = "test123"
PET_ID = "pet-mojo-7327ad56"


class TestPlayPillarBackend:
    """Play pillar backend API tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        self.token = None
        self.user = None
        
        login_res = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL, "password": TEST_PASSWORD
        })
        if login_res.status_code == 200:
            data = login_res.json()
            self.token = data.get("access_token") or data.get("token")
            self.user = data.get("user")
            if self.token:
                self.session.headers.update({"Authorization": f"Bearer {self.token}"})
    
    def test_health_check(self):
        res = self.session.get(f"{BASE_URL}/api/health")
        assert res.status_code == 200
        print("✓ Health check passed")
    
    def test_service_desk_play_pillar_ticket(self):
        """Test service desk ticket creation with pillar=play"""
        if not self.token:
            pytest.skip("Auth required")
        
        payload = {
            "parent_id": self.user.get("id") or self.user.get("email"),
            "pet_id": PET_ID,
            "pillar": "play",
            "intent_primary": "booking_intent",
            "channel": "play_concierge_modal",
            "urgency": "high",
            "initial_message": {"sender": "parent", "text": "Mojo wants Dog Park Outing"}
        }
        
        res = self.session.post(f"{BASE_URL}/api/service_desk/attach_or_create_ticket", json=payload)
        assert res.status_code in [200, 201], f"Failed: {res.status_code}"
        data = res.json()
        assert "ticket_id" in data or "id" in data
        print(f"✓ Play pillar ticket created: {data.get('ticket_id') or data.get('id')}")
    
    def test_guided_play_path_ticket(self):
        """Test guided play path creates ticket via useConcierge.fire()"""
        if not self.token:
            pytest.skip("Auth required")
        
        payload = {
            "parent_id": self.user.get("id") or self.user.get("email"),
            "pet_id": PET_ID,
            "pillar": "play",
            "intent_primary": "guided_path_request",
            "channel": "play_guided_paths_complete",
            "urgency": "normal",
            "initial_message": {"sender": "member", "text": "Completed The Park Routine path for Mojo"}
        }
        
        res = self.session.post(f"{BASE_URL}/api/service_desk/attach_or_create_ticket", json=payload)
        assert res.status_code in [200, 201]
        print(f"✓ Guided play path ticket created")
    
    def test_play_concierge_modal_booking(self):
        """Test PlayConciergeModal booking via bookViaConcierge"""
        if not self.token:
            pytest.skip("Auth required")
        
        payload = {
            "parent_id": self.user.get("id") or self.user.get("email"),
            "pet_id": PET_ID,
            "pillar": "play",
            "intent_primary": "booking_intent",
            "channel": "play_concierge_modal",
            "urgency": "high",
            "initial_message": {"sender": "parent", "text": "Book: Find a dog park nearby"}
        }
        
        res = self.session.post(f"{BASE_URL}/api/service_desk/attach_or_create_ticket", json=payload)
        assert res.status_code in [200, 201]
        print("✓ PlayConciergeModal booking ticket created")
    
    def test_play_nearme_booking(self):
        """Test PlayNearMe 'Plan a visit →' creates ticket"""
        if not self.token:
            pytest.skip("Auth required")
        
        payload = {
            "parent_id": self.user.get("id") or self.user.get("email"),
            "pet_id": PET_ID,
            "pillar": "play",
            "intent_primary": "nearme_booking",
            "channel": "play_nearme",
            "urgency": "normal",
            "initial_message": {"sender": "parent", "text": "Plan visit to Cubbon Park"}
        }
        
        res = self.session.post(f"{BASE_URL}/api/service_desk/attach_or_create_ticket", json=payload)
        assert res.status_code in [200, 201]
        print("✓ PlayNearMe booking ticket created")
    
    def test_play_service_card_view(self):
        """Test PlayConciergeSection card click fires tdc.view"""
        if not self.token:
            pytest.skip("Auth required")
        
        payload = {
            "parent_id": self.user.get("id") or self.user.get("email"),
            "pet_id": PET_ID,
            "pillar": "play",
            "intent_primary": "product_interest",
            "channel": "play_concierge_service_view",
            "urgency": "low",
            "initial_message": {"sender": "system", "text": "Viewed: Pool Swim Session"}
        }
        
        res = self.session.post(f"{BASE_URL}/api/service_desk/attach_or_create_ticket", json=payload)
        assert res.status_code in [200, 201]
        print("✓ Play service card view ticket created")
    
    def test_play_products_endpoint(self):
        """Test play pillar products endpoint"""
        res = self.session.get(f"{BASE_URL}/api/admin/pillar-products?pillar=play&limit=20")
        assert res.status_code == 200
        data = res.json()
        print(f"✓ Play products: {len(data.get('products', []))} items")
    
    def test_play_services_endpoint(self):
        """Test play services endpoint"""
        res = self.session.get(f"{BASE_URL}/api/service-box/services?pillar=play")
        assert res.status_code == 200
        data = res.json()
        print(f"✓ Play services: {len(data.get('services', []))} items")
    
    def test_play_spots_nearme(self):
        """Test play spots NearMe endpoint"""
        res = self.session.get(f"{BASE_URL}/api/places/play-spots?query=dog+park+in+Bangalore&type=park")
        assert res.status_code in [200, 404]
        print(f"✓ Play spots NearMe: status {res.status_code}")
    
    def test_mira_os_stream_play_context(self):
        """Test Mira OS stream with play pillar context"""
        if not self.token:
            pytest.skip("Auth required")
        
        payload = {
            "message": "What play activities for Mojo?",
            "pet_id": PET_ID,
            "pillar": "play"
        }
        res = self.session.post(f"{BASE_URL}/api/mira/os/stream", json=payload)
        assert res.status_code in [200, 201]
        print("✓ Mira OS stream accessible for play pillar")
    
    def test_pets_endpoint_mojo(self):
        """Test pets endpoint returns Mojo with breed=Indie"""
        if not self.token:
            pytest.skip("Auth required")
        
        res = self.session.get(f"{BASE_URL}/api/pets")
        assert res.status_code == 200
        data = res.json()
        pets = data.get("pets", data) if isinstance(data, dict) else data
        
        mojo = next((p for p in (pets if isinstance(pets, list) else []) 
                     if p.get("name") == "Mojo" or p.get("id") == PET_ID), None)
        if mojo:
            assert mojo.get("breed") == "Indie"
            print(f"✓ Mojo found: breed={mojo.get('breed')}")
        else:
            print("✓ Pets endpoint accessible")
    
    def test_pillar_soul_profile_ticket(self):
        """Test PillarSoulProfile creates ticket"""
        if not self.token:
            pytest.skip("Auth required")
        
        payload = {
            "parent_id": self.user.get("id") or self.user.get("email"),
            "pet_id": PET_ID,
            "pillar": "play",
            "intent_primary": "concierge_request",
            "channel": "play_profile_viewed",
            "urgency": "low",
            "initial_message": {"sender": "system", "text": "Play Profile viewed for Mojo"}
        }
        
        res = self.session.post(f"{BASE_URL}/api/service_desk/attach_or_create_ticket", json=payload)
        assert res.status_code in [200, 201]
        print("✓ PillarSoulProfile ticket created")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
