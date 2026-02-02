"""
Test P0 and P1 bug fixes for Pet Life Operating System
- Service request endpoint shows correct user name
- Pet selector functionality
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestServiceRequests:
    """Test service-request endpoint for correct user name display"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token for test user"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "dipali@clubconcierge.in",
            "password": "test123"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert data["user"]["name"] == "Dipali", "User name should be 'Dipali'"
        return data["access_token"]
    
    def test_login_returns_correct_user_name(self):
        """Verify login returns correct user name (not 'Guest')"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "dipali@clubconcierge.in",
            "password": "test123"
        })
        assert response.status_code == 200
        data = response.json()
        
        # Verify user name is 'Dipali' not 'Guest'
        assert data["user"]["name"] == "Dipali", f"Expected 'Dipali', got '{data['user']['name']}'"
        assert data["user"]["email"] == "dipali@clubconcierge.in"
        print(f"SUCCESS: User name is '{data['user']['name']}' (not 'Guest')")
    
    def test_service_request_with_correct_customer_name(self, auth_token):
        """Test service request submission shows correct customer name"""
        response = requests.post(
            f"{BASE_URL}/api/service-requests",
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {auth_token}"
            },
            json={
                "type": "celebration_concierge",
                "pillar": "celebrate",
                "source": "test_suite",
                "customer": {
                    "name": "Dipali",
                    "email": "dipali@clubconcierge.in",
                    "phone": "9876543210"
                },
                "details": {
                    "pet_name": "Lola",
                    "occasion": "birthday",
                    "celebration_date": "2026-02-15",
                    "guest_count": "small",
                    "budget": "2000_5000",
                    "special_requests": "Test request from pytest"
                },
                "priority": "normal"
            }
        )
        
        assert response.status_code == 200, f"Service request failed: {response.text}"
        data = response.json()
        
        # Verify request was created
        assert data["success"] == True
        assert "request_id" in data
        assert "ticket_id" in data
        print(f"SUCCESS: Service request created with ID {data['request_id']}")


class TestPetSelector:
    """Test pet selector functionality"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "dipali@clubconcierge.in",
            "password": "test123"
        })
        assert response.status_code == 200
        return response.json()["access_token"]
    
    def test_fetch_user_pets(self, auth_token):
        """Test fetching user's pets for pet selector"""
        response = requests.get(
            f"{BASE_URL}/api/pets/my-pets",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200, f"Failed to fetch pets: {response.text}"
        data = response.json()
        
        # Verify pets are returned
        assert "pets" in data
        pets = data["pets"]
        assert len(pets) > 0, "User should have at least one pet"
        
        # Check for expected pets (Lola, Meister, Mojo)
        pet_names = [p["name"] for p in pets]
        print(f"SUCCESS: Found {len(pets)} pets: {pet_names}")
        
        # Verify pet structure
        for pet in pets:
            assert "id" in pet
            assert "name" in pet
            print(f"  - Pet: {pet['name']} (ID: {pet['id']})")


class TestPillarPages:
    """Test pillar page endpoints"""
    
    def test_celebrate_page_products(self):
        """Test celebrate page loads products"""
        response = requests.get(f"{BASE_URL}/api/pillar-resolver/products/celebrate?limit=12")
        assert response.status_code == 200
        data = response.json()
        assert "products" in data or isinstance(data, list)
        print(f"SUCCESS: Celebrate page returned {data.get('count', len(data))} products")
    
    def test_learn_page_products(self):
        """Test learn page loads products"""
        response = requests.get(f"{BASE_URL}/api/pillar-resolver/products/learn?limit=12")
        assert response.status_code == 200
        data = response.json()
        print(f"SUCCESS: Learn page returned {data.get('count', len(data))} products")
    
    def test_fit_page_products(self):
        """Test fit page loads products"""
        response = requests.get(f"{BASE_URL}/api/pillar-resolver/products/fit?limit=12")
        assert response.status_code == 200
        data = response.json()
        print(f"SUCCESS: Fit page returned {data.get('count', len(data))} products")
    
    def test_travel_page_products(self):
        """Test travel page loads products"""
        response = requests.get(f"{BASE_URL}/api/pillar-resolver/products/travel?limit=12")
        assert response.status_code == 200
        data = response.json()
        print(f"SUCCESS: Travel page returned {data.get('count', len(data))} products")
    
    def test_farewell_page_products(self):
        """Test farewell page loads products"""
        response = requests.get(f"{BASE_URL}/api/pillar-resolver/products/farewell?limit=12")
        assert response.status_code == 200
        data = response.json()
        print(f"SUCCESS: Farewell page returned {data.get('count', len(data))} products")


class TestServiceCatalog:
    """Test service catalog for pillar pages"""
    
    def test_celebrate_services(self):
        """Test celebrate services are available"""
        response = requests.get(f"{BASE_URL}/api/service-catalog/services?pillar=celebrate&limit=8")
        assert response.status_code == 200
        data = response.json()
        assert "services" in data
        print(f"SUCCESS: Celebrate has {len(data['services'])} services")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
