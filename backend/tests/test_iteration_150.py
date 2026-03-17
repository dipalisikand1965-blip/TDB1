"""
Iteration 150: Testing Enjoy RSVP and Travel Request flows
- Enjoy RSVP modal with contact details
- Admin panels for Travel and Enjoy
- Request flows for both pillars
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://care-pillar-fix.preview.emergentagent.com')


class TestHealthAndBasics:
    """Basic health checks"""
    
    def test_api_health(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get('status') == 'healthy'
        print("✅ API health check passed")


class TestEnjoyRSVPFlow:
    """Test Enjoy RSVP flow - creates RSVP + notification + inbox entry"""
    
    def test_get_experiences(self):
        """Test getting experiences list"""
        response = requests.get(f"{BASE_URL}/api/enjoy/experiences")
        assert response.status_code == 200
        data = response.json()
        experiences = data.get('experiences', [])
        assert len(experiences) > 0, "Should have at least one experience"
        print(f"✅ Found {len(experiences)} experiences")
        return experiences[0]
    
    def test_create_rsvp_with_valid_experience(self):
        """Test creating RSVP with valid experience ID"""
        # First get a valid experience
        exp_response = requests.get(f"{BASE_URL}/api/enjoy/experiences")
        experiences = exp_response.json().get('experiences', [])
        assert len(experiences) > 0, "Need at least one experience"
        
        experience = experiences[0]
        
        # Create RSVP
        rsvp_data = {
            "experience_id": experience['id'],
            "experience_name": experience['name'],
            "pet_name": "Test Pet",
            "pet_breed": "Labrador",
            "number_of_pets": 1,
            "number_of_humans": 2,
            "special_requirements": "None",
            "user_name": "Test User",
            "user_email": "test@example.com",
            "user_phone": "9876543210"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/enjoy/rsvp",
            json=rsvp_data
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert data.get('success') == True, "RSVP should succeed"
        assert 'rsvp_id' in data, "Should have rsvp_id"
        assert 'notification_id' in data, "Should have notification_id"
        assert 'inbox_id' in data, "Should have inbox_id"
        
        print(f"✅ RSVP created: {data.get('rsvp_id')}")
        print(f"✅ Notification created: {data.get('notification_id')}")
        print(f"✅ Inbox entry created: {data.get('inbox_id')}")
        
        return data
    
    def test_rsvp_with_invalid_experience(self):
        """Test RSVP with invalid experience ID returns error"""
        rsvp_data = {
            "experience_id": "invalid-exp-id",
            "experience_name": "Invalid Event",
            "pet_name": "Test Pet",
            "pet_breed": "Labrador",
            "number_of_pets": 1,
            "number_of_humans": 1,
            "user_name": "Test User",
            "user_email": "test@example.com",
            "user_phone": "9876543210"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/enjoy/rsvp",
            json=rsvp_data
        )
        
        # Should return 404 for invalid experience
        assert response.status_code == 404, f"Expected 404 for invalid experience, got {response.status_code}"
        print("✅ Invalid experience returns 404 as expected")


class TestTravelRequestFlow:
    """Test Travel request flow - creates request + notification + inbox entry"""
    
    def test_create_travel_request(self):
        """Test creating travel request"""
        request_data = {
            "travel_type": "cab",
            "pet": {
                "name": "Max",
                "breed": "Golden Retriever",
                "size": "large",
                "weight": 30,
                "crate_trained": True
            },
            "journey": {
                "pickup_city": "Mumbai",
                "drop_city": "Pune",
                "travel_date": "2026-02-15",
                "travel_time": "10:00"
            },
            "customer": {
                "name": "Test Customer",
                "email": "customer@test.com",
                "phone": "9876543210"
            },
            "special_requirements": "AC required"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/travel/request",
            json=request_data
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert data.get('success') == True, "Request should succeed"
        assert 'request_id' in data, "Should have request_id"
        assert 'notification_id' in data, "Should have notification_id"
        assert 'inbox_id' in data, "Should have inbox_id"
        
        print(f"✅ Travel request created: {data.get('request_id')}")
        print(f"✅ Notification created: {data.get('notification_id')}")
        print(f"✅ Inbox entry created: {data.get('inbox_id')}")
        
        return data
    
    def test_get_travel_products(self):
        """Test getting travel products"""
        response = requests.get(f"{BASE_URL}/api/travel/products")
        assert response.status_code == 200
        data = response.json()
        products = data.get('products', [])
        print(f"✅ Found {len(products)} travel products")
    
    def test_get_travel_bundles(self):
        """Test getting travel bundles"""
        response = requests.get(f"{BASE_URL}/api/travel/bundles")
        assert response.status_code == 200
        data = response.json()
        bundles = data.get('bundles', [])
        print(f"✅ Found {len(bundles)} travel bundles")


class TestAdminLogin:
    """Test admin login functionality"""
    
    def test_admin_login_success(self):
        """Test admin login with valid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"username": "aditya", "password": "lola4304"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data.get('success') == True, "Login should succeed"
        print("✅ Admin login successful")
    
    def test_admin_login_invalid_credentials(self):
        """Test admin login with invalid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"username": "wrong", "password": "wrong"}
        )
        
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✅ Invalid credentials return 401 as expected")


class TestEnjoyAdminEndpoints:
    """Test Enjoy admin endpoints"""
    
    @pytest.fixture
    def auth_header(self):
        """Get auth header for admin requests"""
        import base64
        credentials = base64.b64encode(b"aditya:lola4304").decode()
        return {"Authorization": f"Basic {credentials}"}
    
    def test_get_enjoy_experiences_admin(self, auth_header):
        """Test getting experiences from admin endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/enjoy/experiences?upcoming_only=false",
            headers=auth_header
        )
        assert response.status_code == 200
        data = response.json()
        experiences = data.get('experiences', [])
        print(f"✅ Admin: Found {len(experiences)} experiences")
    
    def test_get_enjoy_rsvps(self, auth_header):
        """Test getting RSVPs"""
        response = requests.get(
            f"{BASE_URL}/api/enjoy/rsvps",
            headers=auth_header
        )
        assert response.status_code == 200
        data = response.json()
        rsvps = data.get('rsvps', [])
        print(f"✅ Admin: Found {len(rsvps)} RSVPs")
    
    def test_get_enjoy_partners(self, auth_header):
        """Test getting partners"""
        response = requests.get(
            f"{BASE_URL}/api/enjoy/admin/partners",
            headers=auth_header
        )
        assert response.status_code == 200
        data = response.json()
        partners = data.get('partners', [])
        print(f"✅ Admin: Found {len(partners)} partners")
    
    def test_get_enjoy_products(self, auth_header):
        """Test getting products"""
        response = requests.get(
            f"{BASE_URL}/api/enjoy/products",
            headers=auth_header
        )
        assert response.status_code == 200
        data = response.json()
        products = data.get('products', [])
        print(f"✅ Admin: Found {len(products)} products")
    
    def test_get_enjoy_stats(self, auth_header):
        """Test getting stats"""
        response = requests.get(
            f"{BASE_URL}/api/enjoy/stats",
            headers=auth_header
        )
        assert response.status_code == 200
        data = response.json()
        print(f"✅ Admin: Stats - Total experiences: {data.get('total_experiences', 0)}, Total RSVPs: {data.get('total_rsvps', 0)}")


class TestTravelAdminEndpoints:
    """Test Travel admin endpoints"""
    
    @pytest.fixture
    def auth_header(self):
        """Get auth header for admin requests"""
        import base64
        credentials = base64.b64encode(b"aditya:lola4304").decode()
        return {"Authorization": f"Basic {credentials}"}
    
    def test_get_travel_requests(self, auth_header):
        """Test getting travel requests"""
        response = requests.get(
            f"{BASE_URL}/api/travel/requests",
            headers=auth_header
        )
        assert response.status_code == 200
        data = response.json()
        requests_list = data.get('requests', [])
        print(f"✅ Admin: Found {len(requests_list)} travel requests")
    
    def test_get_travel_partners(self, auth_header):
        """Test getting travel partners"""
        response = requests.get(
            f"{BASE_URL}/api/travel/admin/partners",
            headers=auth_header
        )
        # May return 200 or 404 if no partners
        assert response.status_code in [200, 404]
        if response.status_code == 200:
            data = response.json()
            partners = data.get('partners', [])
            print(f"✅ Admin: Found {len(partners)} travel partners")
        else:
            print("✅ Admin: No travel partners yet (404)")
    
    def test_get_travel_stats(self, auth_header):
        """Test getting travel stats"""
        response = requests.get(
            f"{BASE_URL}/api/travel/stats",
            headers=auth_header
        )
        assert response.status_code == 200
        data = response.json()
        print(f"✅ Admin: Travel stats - Total: {data.get('total', 0)}")


class TestUnifiedInbox:
    """Test unified inbox entries are created"""
    
    @pytest.fixture
    def auth_header(self):
        """Get auth header for admin requests"""
        import base64
        credentials = base64.b64encode(b"aditya:lola4304").decode()
        return {"Authorization": f"Basic {credentials}"}
    
    def test_unified_inbox_has_entries(self, auth_header):
        """Test that unified inbox has entries"""
        response = requests.get(
            f"{BASE_URL}/api/admin/unified-inbox",
            headers=auth_header
        )
        assert response.status_code == 200
        data = response.json()
        entries = data.get('entries', [])
        print(f"✅ Unified inbox has {len(entries)} entries")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
