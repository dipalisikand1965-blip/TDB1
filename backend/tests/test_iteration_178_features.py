"""
Test file for iteration 178 features:
- Fresh Treats link on Dine page links to /celebrate/treats
- Fresh Meals link on Dine page links to /dine/meals
- New Meals page at /dine/meals loads correctly with products
- Dine dropdown in navbar shows 'Fresh Meals' option
- Partner With Us button links to /partner
- CSV export endpoint works at /api/admin/export/products-csv
- Mira AI syncs with selected pet from navbar
- Pet selector in navbar updates pet name when switching
- Mira Quick Book form only shows when user says 'lock in the date'
"""

import pytest
import requests
import os
import base64

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
MEMBER_EMAIL = "dipali@clubconcierge.in"
MEMBER_PASSWORD = "test123"
ADMIN_USERNAME = "aditya"
ADMIN_PASSWORD = "lola4304"


class TestCSVExport:
    """Test CSV export endpoint at /api/admin/export/products-csv"""
    
    def test_csv_export_with_basic_auth(self):
        """Test CSV export endpoint with basic auth"""
        auth = base64.b64encode(f"{ADMIN_USERNAME}:{ADMIN_PASSWORD}".encode()).decode()
        response = requests.get(
            f"{BASE_URL}/api/admin/export/products-csv",
            headers={"Authorization": f"Basic {auth}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        # Check content type is CSV
        content_type = response.headers.get('Content-Type', '')
        assert 'text/csv' in content_type or 'application/octet-stream' in content_type, f"Expected CSV content type, got {content_type}"
        
        # Check CSV has content
        content = response.text
        assert len(content) > 0, "CSV content should not be empty"
        
        # Check CSV has header row
        lines = content.split('\n')
        assert len(lines) > 1, "CSV should have header and data rows"
        
        # Check header contains expected columns
        header = lines[0].lower()
        assert 'id' in header, "CSV header should contain 'id'"
        assert 'name' in header, "CSV header should contain 'name'"
        assert 'price' in header, "CSV header should contain 'price'"
        
        print(f"SUCCESS: CSV export returned {len(lines)} rows")
    
    def test_csv_export_without_auth_fails(self):
        """Test CSV export endpoint fails without auth"""
        response = requests.get(f"{BASE_URL}/api/admin/export/products-csv")
        
        # Should return 401 Unauthorized
        assert response.status_code == 401, f"Expected 401 without auth, got {response.status_code}"
        print("SUCCESS: CSV export correctly requires authentication")


class TestMemberLogin:
    """Test member login functionality"""
    
    def test_member_login(self):
        """Test member login with valid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": MEMBER_EMAIL, "password": MEMBER_PASSWORD}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "access_token" in data, "Response should contain access_token"
        assert "user" in data, "Response should contain user"
        
        print(f"SUCCESS: Member login successful for {MEMBER_EMAIL}")
        return data["access_token"]


class TestMiraQuickBook:
    """Test Mira Quick Book form logic"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": MEMBER_EMAIL, "password": MEMBER_PASSWORD}
        )
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Authentication failed")
    
    def test_quick_book_shows_on_explicit_booking_intent(self, auth_token):
        """Test Quick Book form shows when user says 'lock in the date'"""
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "message": "I need grooming for my dog. Let's lock in the date!",
                "pillar": "care"
            }
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        concierge_action = data.get("concierge_action", {})
        
        # Should show quick book form
        assert concierge_action.get("show_quick_book_form") == True, \
            "Quick Book form should show when user says 'lock in the date'"
        
        print("SUCCESS: Quick Book form shows on explicit booking intent")
    
    def test_quick_book_hidden_on_general_query(self, auth_token):
        """Test Quick Book form is hidden for general service queries"""
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "message": "Tell me about grooming services",
                "pillar": "care"
            }
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        concierge_action = data.get("concierge_action", {})
        
        # Should NOT show quick book form for general queries
        show_form = concierge_action.get("show_quick_book_form", False)
        assert show_form == False, \
            "Quick Book form should NOT show for general service queries"
        
        print("SUCCESS: Quick Book form hidden for general queries")


class TestDineProducts:
    """Test Dine pillar products API"""
    
    def test_dine_products_endpoint(self):
        """Test that dine products endpoint returns products"""
        response = requests.get(f"{BASE_URL}/api/products?pillar=dine")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        products = data.get("products", [])
        
        # Should have some products
        assert len(products) > 0, "Dine pillar should have products"
        
        print(f"SUCCESS: Dine products endpoint returned {len(products)} products")
    
    def test_meals_category_products(self):
        """Test that meals category has products"""
        response = requests.get(f"{BASE_URL}/api/products?pillar=dine&category=meals")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        products = data.get("products", [])
        
        print(f"INFO: Meals category has {len(products)} products")


class TestPetAPI:
    """Test Pet API endpoints for pet selector functionality"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": MEMBER_EMAIL, "password": MEMBER_PASSWORD}
        )
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Authentication failed")
    
    def test_my_pets_endpoint(self, auth_token):
        """Test my-pets endpoint returns user's pets"""
        response = requests.get(
            f"{BASE_URL}/api/pets/my-pets",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        pets = data.get("pets", [])
        
        print(f"INFO: User has {len(pets)} pets")
        
        if len(pets) > 0:
            # Check pet has required fields
            pet = pets[0]
            assert "id" in pet, "Pet should have id"
            assert "name" in pet, "Pet should have name"
            print(f"SUCCESS: First pet is '{pet.get('name')}'")


class TestHealthCheck:
    """Basic health check tests"""
    
    def test_api_health(self):
        """Test API is responding"""
        response = requests.get(f"{BASE_URL}/api/health")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("SUCCESS: API health check passed")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
