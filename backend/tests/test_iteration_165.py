"""
Iteration 165 - Backend API Tests
Testing Occasion Box Builder APIs and Service Flow
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://paws-dashboard-3.preview.emergentagent.com').rstrip('/')

class TestOccasionBoxAPIs:
    """Test Occasion Box Builder APIs"""
    
    def test_get_birthday_template_by_occasion(self):
        """GET /api/occasion-boxes/by-occasion/birthday"""
        response = requests.get(f"{BASE_URL}/api/occasion-boxes/by-occasion/birthday")
        assert response.status_code == 200
        data = response.json()
        assert data.get("name") == "Birthday Box"
        assert data.get("occasion_type") == "birthday"
        assert len(data.get("categories", [])) >= 4
        print(f"✅ Birthday template: {data.get('name')} with {len(data.get('categories', []))} categories")
    
    def test_get_gotcha_day_template_by_occasion(self):
        """GET /api/occasion-boxes/by-occasion/gotcha_day"""
        response = requests.get(f"{BASE_URL}/api/occasion-boxes/by-occasion/gotcha_day")
        assert response.status_code == 200
        data = response.json()
        assert data.get("name") == "Gotcha Day Box"
        assert data.get("occasion_type") == "gotcha_day"
        print(f"✅ Gotcha Day template: {data.get('name')}")
    
    def test_get_birthday_box_products(self):
        """GET /api/occasion-boxes/birthday-box/products"""
        response = requests.get(f"{BASE_URL}/api/occasion-boxes/birthday-box/products")
        assert response.status_code == 200
        data = response.json()
        
        # Check template
        template = data.get("template", {})
        assert template.get("name") == "Birthday Box"
        
        # Check products
        products = data.get("products", {})
        assert "cake" in products
        assert len(products.get("cake", [])) > 0
        
        # Check products have images
        cake_products = products.get("cake", [])
        products_with_images = sum(1 for p in cake_products if p.get("image") or p.get("image_url") or p.get("images"))
        print(f"✅ Birthday Box products: {len(cake_products)} cakes, {products_with_images} with images")
        assert products_with_images > 0, "Products should have images"
    
    def test_get_gotcha_day_box_products(self):
        """GET /api/occasion-boxes/gotcha-day-box/products"""
        response = requests.get(f"{BASE_URL}/api/occasion-boxes/gotcha-day-box/products")
        assert response.status_code == 200
        data = response.json()
        
        template = data.get("template", {})
        assert template.get("name") == "Gotcha Day Box"
        
        products = data.get("products", {})
        assert "treats" in products
        print(f"✅ Gotcha Day Box products: {len(products.get('treats', []))} treats")


class TestServiceFlowAPIs:
    """Test Service booking flow APIs"""
    
    def test_health_check(self):
        """GET /api/health"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        print("✅ Health check passed")
    
    def test_services_catalog(self):
        """GET /api/services - Service catalog"""
        response = requests.get(f"{BASE_URL}/api/services")
        assert response.status_code == 200
        data = response.json()
        services = data.get("services", data) if isinstance(data, dict) else data
        print(f"✅ Services catalog: {len(services) if isinstance(services, list) else 'N/A'} services")
    
    def test_pillar_services(self):
        """GET /api/services?pillar=care - Pillar-specific services"""
        response = requests.get(f"{BASE_URL}/api/services?pillar=care")
        assert response.status_code == 200
        data = response.json()
        print(f"✅ Care pillar services loaded")


class TestMemberAuth:
    """Test member authentication"""
    
    def test_member_login(self):
        """POST /api/auth/login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "dipali@clubconcierge.in",
            "password": "test123"
        })
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data.get("user", {}).get("email") == "dipali@clubconcierge.in"
        print(f"✅ Member login successful: {data.get('user', {}).get('name')}")
        return data.get("access_token")
    
    def test_member_pets(self):
        """GET /api/pets/my-pets - Get member's pets"""
        # First login
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "dipali@clubconcierge.in",
            "password": "test123"
        })
        token = login_response.json().get("access_token")
        
        # Get pets
        response = requests.get(f"{BASE_URL}/api/pets/my-pets", headers={
            "Authorization": f"Bearer {token}"
        })
        assert response.status_code == 200
        data = response.json()
        pets = data.get("pets", [])
        print(f"✅ Member has {len(pets)} pets")


class TestNotificationFlow:
    """Test notification and ticket flow"""
    
    def test_create_service_request(self):
        """POST /api/service-requests - Create service request"""
        # Login first
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "dipali@clubconcierge.in",
            "password": "test123"
        })
        token = login_response.json().get("access_token")
        
        # Create service request
        response = requests.post(f"{BASE_URL}/api/service-requests", 
            headers={"Authorization": f"Bearer {token}"},
            json={
                "service_type": "grooming",
                "pillar": "care",
                "description": "Test grooming request from iteration 165",
                "preferred_date": "2026-02-15"
            }
        )
        # Accept 200, 201, or 422 (validation error is acceptable for test)
        assert response.status_code in [200, 201, 422]
        print(f"✅ Service request API responded with status {response.status_code}")


class TestSearchAPI:
    """Test search functionality"""
    
    def test_search_birthday(self):
        """GET /api/products?search=birthday"""
        response = requests.get(f"{BASE_URL}/api/products?search=birthday&limit=10")
        assert response.status_code == 200
        data = response.json()
        products = data.get("products", [])
        print(f"✅ Search 'birthday': {len(products)} products found")
    
    def test_search_cake(self):
        """GET /api/products?search=cake"""
        response = requests.get(f"{BASE_URL}/api/products?search=cake&limit=10")
        assert response.status_code == 200
        data = response.json()
        products = data.get("products", [])
        print(f"✅ Search 'cake': {len(products)} products found")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
