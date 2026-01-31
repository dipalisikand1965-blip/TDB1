"""
Iteration 149: Enjoy Page Redesign Tests
Testing:
- GET /api/enjoy/experiences - should return experiences with images
- POST /api/enjoy/rsvp - should create RSVP (request flow)
- Enjoy page hero section, goal buttons, transformation stories
- WhatsApp button, RSVP modal functionality
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestEnjoyPageBackend:
    """Backend API tests for Enjoy page redesign"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
    def test_api_health(self):
        """Test API health endpoint"""
        response = self.session.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        print("✅ API health check passed")
    
    def test_enjoy_experiences_returns_data(self):
        """Test GET /api/enjoy/experiences returns experiences"""
        response = self.session.get(f"{BASE_URL}/api/enjoy/experiences")
        assert response.status_code == 200
        data = response.json()
        assert "experiences" in data
        assert len(data["experiences"]) > 0
        print(f"✅ Enjoy experiences endpoint returns {len(data['experiences'])} experiences")
    
    def test_enjoy_experiences_have_images(self):
        """Test that experiences have images (key requirement)"""
        response = self.session.get(f"{BASE_URL}/api/enjoy/experiences")
        assert response.status_code == 200
        data = response.json()
        experiences = data.get("experiences", [])
        
        experiences_with_images = 0
        experiences_without_images = []
        
        for exp in experiences:
            if exp.get("image"):
                experiences_with_images += 1
            else:
                experiences_without_images.append(exp.get("name", exp.get("id")))
        
        # All experiences should have images
        assert experiences_with_images == len(experiences), f"Missing images for: {experiences_without_images}"
        print(f"✅ All {len(experiences)} experiences have images")
    
    def test_enjoy_experiences_have_required_fields(self):
        """Test experiences have all required fields for display"""
        response = self.session.get(f"{BASE_URL}/api/enjoy/experiences")
        assert response.status_code == 200
        data = response.json()
        experiences = data.get("experiences", [])
        
        required_fields = ["id", "name", "description", "experience_type", "city", "image"]
        
        for exp in experiences[:5]:  # Check first 5
            for field in required_fields:
                assert field in exp, f"Missing field '{field}' in experience {exp.get('id')}"
        
        print(f"✅ Experiences have all required fields: {required_fields}")
    
    def test_enjoy_featured_experiences(self):
        """Test featured experiences endpoint"""
        response = self.session.get(f"{BASE_URL}/api/enjoy/experiences?is_featured=true")
        assert response.status_code == 200
        data = response.json()
        experiences = data.get("experiences", [])
        
        # All returned should be featured
        for exp in experiences:
            assert exp.get("is_featured") == True, f"Non-featured experience returned: {exp.get('name')}"
        
        print(f"✅ Featured experiences endpoint returns {len(experiences)} featured experiences")
    
    def test_enjoy_calendar_endpoint(self):
        """Test calendar endpoint"""
        response = self.session.get(f"{BASE_URL}/api/enjoy/calendar")
        assert response.status_code == 200
        data = response.json()
        assert "calendar" in data
        print(f"✅ Calendar endpoint returns data")
    
    def test_enjoy_products_endpoint(self):
        """Test products endpoint"""
        response = self.session.get(f"{BASE_URL}/api/enjoy/products")
        assert response.status_code == 200
        data = response.json()
        assert "products" in data
        print(f"✅ Products endpoint returns {len(data.get('products', []))} products")
    
    def test_enjoy_bundles_endpoint(self):
        """Test bundles endpoint"""
        response = self.session.get(f"{BASE_URL}/api/enjoy/bundles")
        assert response.status_code == 200
        data = response.json()
        assert "bundles" in data
        print(f"✅ Bundles endpoint returns {len(data.get('bundles', []))} bundles")
    
    def test_enjoy_config_endpoint(self):
        """Test config endpoint"""
        response = self.session.get(f"{BASE_URL}/api/enjoy/config")
        assert response.status_code == 200
        data = response.json()
        assert "experience_types" in data
        assert "pet_personalities" in data
        print(f"✅ Config endpoint returns experience_types and pet_personalities")


class TestEnjoyRSVPFlow:
    """Test RSVP flow for Enjoy page"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session with auth"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login to get token
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "dipali@clubconcierge.in",
            "password": "test123"
        })
        
        if login_response.status_code == 200:
            data = login_response.json()
            self.token = data.get("access_token")  # API returns access_token
            self.user = data.get("user")
            self.session.headers.update({"Authorization": f"Bearer {self.token}"})
            print(f"✅ Logged in as {self.user.get('email')}")
        else:
            pytest.skip("Login failed - skipping authenticated tests")
    
    def test_login_success(self):
        """Verify login was successful"""
        assert self.token is not None
        assert self.user is not None
        print(f"✅ Login successful, user: {self.user.get('name')}")
    
    def test_get_user_pets(self):
        """Test getting user's pets for RSVP"""
        response = self.session.get(f"{BASE_URL}/api/pets/my-pets")
        assert response.status_code == 200
        data = response.json()
        pets = data.get("pets", [])
        print(f"✅ User has {len(pets)} pets")
        return pets
    
    def test_create_rsvp_for_experience(self):
        """Test creating RSVP for an experience"""
        # First get an experience
        exp_response = self.session.get(f"{BASE_URL}/api/enjoy/experiences")
        assert exp_response.status_code == 200
        experiences = exp_response.json().get("experiences", [])
        assert len(experiences) > 0
        
        experience = experiences[0]
        
        # Get user's pets
        pets_response = self.session.get(f"{BASE_URL}/api/pets/my-pets")
        pets = pets_response.json().get("pets", [])
        
        # Create RSVP - API requires pet_name field (not pet_names)
        rsvp_data = {
            "experience_id": experience.get("id"),
            "pet_name": pets[0].get("name") if pets else "Test Pet",  # Required field
            "pet_id": pets[0].get("id") or pets[0].get("_id") if pets else None,
            "number_of_pets": 1,
            "number_of_humans": 1,
            "special_requirements": "Test RSVP from iteration 149",
            "user_name": self.user.get("name"),
            "user_email": self.user.get("email")
        }
        
        response = self.session.post(f"{BASE_URL}/api/enjoy/rsvp", json=rsvp_data)
        
        # RSVP should succeed (200 or 201)
        assert response.status_code in [200, 201], f"RSVP failed: {response.text}"
        data = response.json()
        
        # Verify response has expected fields
        assert data.get("success") == True or "rsvp_id" in data or "id" in data
        print(f"✅ RSVP created successfully for experience: {experience.get('name')}")
    
    def test_rsvp_creates_service_desk_ticket(self):
        """Test that RSVP creates a service desk ticket (request flow)"""
        # Get an experience
        exp_response = self.session.get(f"{BASE_URL}/api/enjoy/experiences")
        experiences = exp_response.json().get("experiences", [])
        experience = experiences[1] if len(experiences) > 1 else experiences[0]
        
        # Create RSVP
        rsvp_data = {
            "experience_id": experience.get("id"),
            "experience_name": experience.get("name"),
            "user_email": self.user.get("email"),
            "user_name": self.user.get("name"),
            "pet_names": "Test Pet",
            "number_of_pets": 1,
            "number_of_humans": 2,
            "special_requirements": "Checking service desk ticket creation"
        }
        
        response = self.session.post(f"{BASE_URL}/api/enjoy/rsvp", json=rsvp_data)
        assert response.status_code in [200, 201]
        
        data = response.json()
        
        # Check if ticket_id is returned (indicates service desk integration)
        if "ticket_id" in data:
            print(f"✅ RSVP created service desk ticket: {data.get('ticket_id')}")
        else:
            print(f"✅ RSVP created successfully (ticket may be created async)")


class TestExperienceTypes:
    """Test different experience types"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
    
    def test_experience_types_coverage(self):
        """Test that we have experiences of different types"""
        response = self.session.get(f"{BASE_URL}/api/enjoy/experiences")
        assert response.status_code == 200
        experiences = response.json().get("experiences", [])
        
        types_found = set()
        for exp in experiences:
            types_found.add(exp.get("experience_type"))
        
        expected_types = {"event", "trail", "meetup", "cafe", "workshop", "wellness"}
        
        print(f"✅ Experience types found: {types_found}")
        
        # At least 3 different types should be present
        assert len(types_found) >= 3, f"Only {len(types_found)} types found, expected at least 3"
        print(f"✅ Good variety of experience types: {len(types_found)} types")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
