"""
Test suite for pillar features: Fit, Enjoy, Learn, Paperwork, Farewell
Tests the specific endpoints mentioned in the bug report
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://learn-pillar-audit.preview.emergentagent.com').rstrip('/')

class TestFitPillar:
    """Tests for Fit pillar endpoints"""
    
    def test_fit_plans_returns_list(self):
        """Test /api/fit/plans returns plans list"""
        response = requests.get(f"{BASE_URL}/api/fit/plans")
        assert response.status_code == 200
        data = response.json()
        assert "plans" in data
        assert isinstance(data["plans"], list)
        print(f"✅ Fit plans returned {len(data['plans'])} plans")
    
    def test_fit_bundles_returns_list(self):
        """Test /api/fit/bundles returns bundles"""
        response = requests.get(f"{BASE_URL}/api/fit/bundles")
        assert response.status_code == 200
        data = response.json()
        assert "bundles" in data
        print(f"✅ Fit bundles returned {len(data['bundles'])} bundles")
    
    def test_fit_products_returns_list(self):
        """Test /api/fit/products returns products"""
        response = requests.get(f"{BASE_URL}/api/fit/products")
        assert response.status_code == 200
        data = response.json()
        assert "products" in data
        print(f"✅ Fit products returned {len(data['products'])} products")
    
    def test_fit_request_post_with_auth(self):
        """Test /api/fit/request POST endpoint with authentication"""
        # First login to get token
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "dipali@clubconcierge.in",
            "password": "lola4304"
        })
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]
        
        # Get user's pets
        pets_response = requests.get(f"{BASE_URL}/api/pets/my-pets", headers={
            "Authorization": f"Bearer {token}"
        })
        assert pets_response.status_code == 200
        pets = pets_response.json()["pets"]
        assert len(pets) > 0, "User should have at least one pet"
        
        pet = pets[0]
        
        # Submit fit request
        request_data = {
            "fit_type": "assessment",
            "current_activity_level": "moderate",
            "fitness_goals": ["weight_loss", "endurance"],
            "health_conditions": [],
            "preferred_activities": ["swimming", "fetch"],
            "schedule_preference": "morning",
            "notes": "Test request from pytest",
            "pet_id": pet["id"],
            "pet_name": pet["name"],
            "pet_breed": pet.get("breed", "Unknown"),
            "pet_age": "2",
            "pet_weight": "15",
            "pet_size": "medium",
            "user_id": "test-user",
            "user_name": "Test User",
            "user_email": "dipali@clubconcierge.in",
            "user_phone": "+919739908844"
        }
        
        response = requests.post(f"{BASE_URL}/api/fit/request", 
            json=request_data,
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "request_id" in data
        assert data["request_id"].startswith("FIT-")
        print(f"✅ Fit request created: {data['request_id']}")


class TestEnjoyPillar:
    """Tests for Enjoy pillar endpoints"""
    
    def test_enjoy_experiences_returns_list(self):
        """Test /api/enjoy/experiences returns experiences list"""
        response = requests.get(f"{BASE_URL}/api/enjoy/experiences")
        assert response.status_code == 200
        data = response.json()
        assert "experiences" in data
        assert isinstance(data["experiences"], list)
        assert len(data["experiences"]) > 0, "Should have at least one experience"
        
        # Verify experience structure
        exp = data["experiences"][0]
        assert "id" in exp
        assert "city" in exp
        print(f"✅ Enjoy experiences returned {len(data['experiences'])} experiences")
    
    def test_enjoy_rsvp_post_with_auth(self):
        """Test /api/enjoy/rsvp POST endpoint"""
        # First login
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "dipali@clubconcierge.in",
            "password": "lola4304"
        })
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]
        
        # Get an experience ID
        exp_response = requests.get(f"{BASE_URL}/api/enjoy/experiences")
        assert exp_response.status_code == 200
        experiences = exp_response.json()["experiences"]
        assert len(experiences) > 0
        
        experience_id = experiences[0]["id"]
        
        # Get user's pets
        pets_response = requests.get(f"{BASE_URL}/api/pets/my-pets", headers={
            "Authorization": f"Bearer {token}"
        })
        pets = pets_response.json()["pets"]
        pet = pets[0] if pets else None
        
        # Submit RSVP
        rsvp_data = {
            "experience_id": experience_id,
            "pet_id": pet["id"] if pet else "test-pet",
            "pet_name": pet["name"] if pet else "Test Pet",
            "number_of_pets": 1,
            "number_of_humans": 1,
            "special_requirements": "Test RSVP from pytest"
        }
        
        response = requests.post(f"{BASE_URL}/api/enjoy/rsvp",
            json=rsvp_data,
            headers={"Authorization": f"Bearer {token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "rsvp_id" in data
        assert data["rsvp_id"].startswith("RSVP-")
        print(f"✅ RSVP created: {data['rsvp_id']}")


class TestLearnPillar:
    """Tests for Learn pillar endpoints"""
    
    def test_learn_bundles_returns_list(self):
        """Test /api/learn/bundles returns bundles with required fields"""
        response = requests.get(f"{BASE_URL}/api/learn/bundles")
        assert response.status_code == 200
        data = response.json()
        assert "bundles" in data
        assert isinstance(data["bundles"], list)
        assert len(data["bundles"]) > 0, "Should have at least one bundle"
        
        # Verify bundle structure
        bundle = data["bundles"][0]
        assert "id" in bundle
        assert "name" in bundle
        assert "price" in bundle
        print(f"✅ Learn bundles returned {len(data['bundles'])} bundles")
        print(f"   First bundle: {bundle['name']} - ₹{bundle['price']}")
    
    def test_learn_products_returns_list(self):
        """Test /api/learn/products returns products"""
        response = requests.get(f"{BASE_URL}/api/learn/products")
        assert response.status_code == 200
        data = response.json()
        assert "products" in data
        print(f"✅ Learn products returned {len(data['products'])} products")


class TestPaperworkPillar:
    """Tests for Paperwork pillar endpoints"""
    
    def test_paperwork_bundles_returns_list(self):
        """Test /api/paperwork/bundles returns bundles"""
        response = requests.get(f"{BASE_URL}/api/paperwork/bundles")
        assert response.status_code == 200
        data = response.json()
        assert "bundles" in data
        assert isinstance(data["bundles"], list)
        assert len(data["bundles"]) > 0, "Should have at least one bundle"
        
        # Verify bundle structure
        bundle = data["bundles"][0]
        assert "id" in bundle
        assert "name" in bundle
        assert "price" in bundle
        print(f"✅ Paperwork bundles returned {len(data['bundles'])} bundles")
        print(f"   First bundle: {bundle['name']} - ₹{bundle['price']}")
    
    def test_paperwork_products_returns_list(self):
        """Test /api/paperwork/products returns products"""
        response = requests.get(f"{BASE_URL}/api/paperwork/products")
        assert response.status_code == 200
        data = response.json()
        assert "products" in data
        print(f"✅ Paperwork products returned {len(data['products'])} products")


class TestFarewellPillar:
    """Tests for Farewell pillar endpoints"""
    
    def test_farewell_service_request_post(self):
        """Test /api/farewell/service-request POST endpoint"""
        # First login
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "dipali@clubconcierge.in",
            "password": "lola4304"
        })
        assert login_response.status_code == 200
        token = login_response.json()["access_token"]
        
        # Submit service request
        request_data = {
            "pet_id": "test-pet",
            "pet_name": "Test Pet",
            "service_type": "cremation",
            "package_id": "loving_tribute",
            "preferred_date": "2026-02-01",
            "preferred_time": "10:00",
            "address": "123 Test Street",
            "city": "Mumbai",
            "phone": "+919739908844",
            "email": "dipali@clubconcierge.in",
            "special_requests": "Test request from pytest",
            "urgency": "planned",
            "user_email": "dipali@clubconcierge.in",
            "package": {"id": "loving_tribute", "name": "Loving Tribute"},
            "status": "pending"
        }
        
        response = requests.post(f"{BASE_URL}/api/farewell/service-request",
            json=request_data,
            headers={"Authorization": f"Bearer {token}"}
        )
        
        # Accept 200 or 201 as success
        assert response.status_code in [200, 201], f"Expected 200/201, got {response.status_code}: {response.text}"
        print(f"✅ Farewell service request submitted successfully")


class TestAuthFlow:
    """Tests for authentication flow"""
    
    def test_login_with_valid_credentials(self):
        """Test login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "dipali@clubconcierge.in",
            "password": "lola4304"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["email"] == "dipali@clubconcierge.in"
        print(f"✅ Login successful for {data['user']['email']}")
    
    def test_get_user_pets(self):
        """Test getting user's pets after login"""
        # Login first
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "dipali@clubconcierge.in",
            "password": "lola4304"
        })
        token = login_response.json()["access_token"]
        
        # Get pets
        response = requests.get(f"{BASE_URL}/api/pets/my-pets", headers={
            "Authorization": f"Bearer {token}"
        })
        assert response.status_code == 200
        data = response.json()
        assert "pets" in data
        assert len(data["pets"]) > 0, "User should have at least one pet"
        print(f"✅ User has {len(data['pets'])} pets")
        for pet in data["pets"]:
            print(f"   - {pet['name']} ({pet.get('breed', 'Unknown breed')})")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
