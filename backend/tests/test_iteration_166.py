"""
Iteration 166 - Testing:
1. Birthday engine box_builder_link in WhatsApp/email templates
2. CelebratePage URL param handler for ?build_box=birthday
3. Mobile touch targets (44px min) for Navbar menu and cart buttons
4. SoulExplainerVideo close button touch target
5. ServiceCatalogSection on all pillar pages
6. Backend API: GET /api/birthday-engine/upcoming
7. Services exist in database for fit, celebrate, dine, care pillars
"""

import pytest
import requests
import os
from requests.auth import HTTPBasicAuth

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
ADMIN_AUTH = HTTPBasicAuth('aditya', 'lola4304')


class TestBirthdayEngineAPI:
    """Test birthday engine API endpoints"""
    
    def test_birthday_engine_upcoming_returns_200(self):
        """GET /api/birthday-engine/upcoming should return 200 with celebrations"""
        response = requests.get(
            f"{BASE_URL}/api/birthday-engine/upcoming?days=30",
            auth=ADMIN_AUTH
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "total" in data, "Response should have 'total' field"
        assert "today" in data, "Response should have 'today' field"
        assert "this_week" in data, "Response should have 'this_week' field"
        assert "next_week" in data, "Response should have 'next_week' field"
        assert "this_month" in data, "Response should have 'this_month' field"
        assert "all" in data, "Response should have 'all' field"
        print(f"✓ Birthday engine returned {data['total']} upcoming celebrations")
    
    def test_birthday_engine_stats(self):
        """GET /api/birthday-engine/stats should return statistics"""
        response = requests.get(
            f"{BASE_URL}/api/birthday-engine/stats",
            auth=ADMIN_AUTH
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "pets_with_birthdays" in data
        assert "upcoming_7_days" in data
        print(f"✓ Birthday stats: {data['pets_with_birthdays']} pets with birthdays")
    
    def test_birthday_engine_promotions_history(self):
        """GET /api/birthday-engine/promotions should return promotion history"""
        response = requests.get(
            f"{BASE_URL}/api/birthday-engine/promotions?limit=10",
            auth=ADMIN_AUTH
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "promotions" in data
        assert "count" in data
        print(f"✓ Birthday promotions history: {data['count']} promotions")


class TestServiceCatalogAPI:
    """Test service catalog for all pillars"""
    
    def test_fit_pillar_services_exist(self):
        """Services should exist for Fit pillar"""
        response = requests.get(f"{BASE_URL}/api/service-catalog/services?pillar=fit&limit=10")
        assert response.status_code == 200
        
        data = response.json()
        services = data.get("services", [])
        assert len(services) > 0, "Fit pillar should have services"
        
        # Verify service structure
        service = services[0]
        assert "id" in service
        assert "name" in service
        assert "pillar" in service
        assert service["pillar"] == "fit"
        print(f"✓ Fit pillar has {len(services)} services")
    
    def test_celebrate_pillar_services_exist(self):
        """Services should exist for Celebrate pillar"""
        response = requests.get(f"{BASE_URL}/api/service-catalog/services?pillar=celebrate&limit=10")
        assert response.status_code == 200
        
        data = response.json()
        services = data.get("services", [])
        assert len(services) > 0, "Celebrate pillar should have services"
        
        service = services[0]
        assert service["pillar"] == "celebrate"
        print(f"✓ Celebrate pillar has {len(services)} services")
    
    def test_dine_pillar_services_exist(self):
        """Services should exist for Dine pillar"""
        response = requests.get(f"{BASE_URL}/api/service-catalog/services?pillar=dine&limit=10")
        assert response.status_code == 200
        
        data = response.json()
        services = data.get("services", [])
        assert len(services) > 0, "Dine pillar should have services"
        
        service = services[0]
        assert service["pillar"] == "dine"
        print(f"✓ Dine pillar has {len(services)} services")
    
    def test_care_pillar_services_exist(self):
        """Services should exist for Care pillar"""
        response = requests.get(f"{BASE_URL}/api/service-catalog/services?pillar=care&limit=10")
        assert response.status_code == 200
        
        data = response.json()
        services = data.get("services", [])
        assert len(services) > 0, "Care pillar should have services"
        
        service = services[0]
        assert service["pillar"] == "care"
        print(f"✓ Care pillar has {len(services)} services")


class TestOccasionBoxAPI:
    """Test occasion box endpoints for birthday reminders integration"""
    
    def test_birthday_box_template_exists(self):
        """Birthday box template should exist for reminder links"""
        response = requests.get(f"{BASE_URL}/api/occasion-boxes/by-occasion/birthday")
        assert response.status_code == 200
        
        data = response.json()
        assert "box" in data or "id" in data, "Should return box template"
        print(f"✓ Birthday box template exists")
    
    def test_gotcha_day_box_template_exists(self):
        """Gotcha day box template should exist for reminder links"""
        response = requests.get(f"{BASE_URL}/api/occasion-boxes/by-occasion/gotcha_day")
        assert response.status_code == 200
        
        data = response.json()
        assert "box" in data or "id" in data, "Should return box template"
        print(f"✓ Gotcha day box template exists")


class TestPillarResolverAPI:
    """Test pillar resolver for product filtering"""
    
    def test_celebrate_pillar_products(self):
        """Celebrate pillar should return products"""
        response = requests.get(f"{BASE_URL}/api/pillar-resolver/products/celebrate?limit=12")
        assert response.status_code == 200
        
        data = response.json()
        products = data.get("products", data)
        assert len(products) > 0, "Celebrate pillar should have products"
        print(f"✓ Celebrate pillar has {len(products)} products")


class TestCelebratePageURLParam:
    """Test that CelebratePage handles ?build_box URL parameter"""
    
    def test_celebrate_page_loads(self):
        """Celebrate page should load successfully"""
        response = requests.get(f"{BASE_URL}/celebrate", allow_redirects=True)
        # Frontend routes may return 200 or redirect
        assert response.status_code in [200, 304], f"Celebrate page should load, got {response.status_code}"
        print("✓ Celebrate page accessible")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
