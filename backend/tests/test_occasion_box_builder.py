"""
Test Occasion Box Builder APIs
Tests the occasion box template and products endpoints
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestOccasionBoxAPIs:
    """Test occasion box template and products APIs"""
    
    def test_get_birthday_template_by_occasion(self):
        """Test GET /api/occasion-boxes/by-occasion/birthday returns template"""
        response = requests.get(f"{BASE_URL}/api/occasion-boxes/by-occasion/birthday")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "name" in data, "Response should contain 'name'"
        assert data["name"] == "Birthday Box", f"Expected 'Birthday Box', got {data.get('name')}"
        assert data["occasion_type"] == "birthday", f"Expected occasion_type 'birthday'"
        assert "categories" in data, "Response should contain 'categories'"
        assert len(data["categories"]) > 0, "Should have at least one category"
        
        # Verify category structure
        cake_category = next((c for c in data["categories"] if c["id"] == "cake"), None)
        assert cake_category is not None, "Should have 'cake' category"
        assert cake_category["required"] == True, "Cake category should be required"
        
        print(f"✓ Birthday template loaded: {data['name']} with {len(data['categories'])} categories")
    
    def test_get_gotcha_day_template_by_occasion(self):
        """Test GET /api/occasion-boxes/by-occasion/gotcha_day returns template"""
        response = requests.get(f"{BASE_URL}/api/occasion-boxes/by-occasion/gotcha_day")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "name" in data, "Response should contain 'name'"
        assert data["name"] == "Gotcha Day Box", f"Expected 'Gotcha Day Box', got {data.get('name')}"
        assert data["occasion_type"] == "gotcha_day", f"Expected occasion_type 'gotcha_day'"
        assert "categories" in data, "Response should contain 'categories'"
        
        print(f"✓ Gotcha Day template loaded: {data['name']} with {len(data['categories'])} categories")
    
    def test_get_birthday_box_products(self):
        """Test GET /api/occasion-boxes/birthday-box/products returns products"""
        response = requests.get(f"{BASE_URL}/api/occasion-boxes/birthday-box/products")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "template" in data, "Response should contain 'template'"
        assert "products" in data, "Response should contain 'products'"
        
        # Verify products structure
        products = data["products"]
        assert isinstance(products, dict), "Products should be a dictionary keyed by category"
        
        # Check if cake category has products
        if "cake" in products:
            cake_products = products["cake"]
            assert isinstance(cake_products, list), "Cake products should be a list"
            if len(cake_products) > 0:
                first_product = cake_products[0]
                assert "id" in first_product, "Product should have 'id'"
                assert "price" in first_product, "Product should have 'price'"
                print(f"✓ Found {len(cake_products)} cake products")
        
        total_products = sum(len(p) for p in products.values())
        print(f"✓ Birthday box products loaded: {total_products} total products across {len(products)} categories")
    
    def test_get_gotcha_day_box_products(self):
        """Test GET /api/occasion-boxes/gotcha-day-box/products returns products"""
        response = requests.get(f"{BASE_URL}/api/occasion-boxes/gotcha-day-box/products")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "template" in data, "Response should contain 'template'"
        assert "products" in data, "Response should contain 'products'"
        
        total_products = sum(len(p) for p in data["products"].values())
        print(f"✓ Gotcha Day box products loaded: {total_products} total products")
    
    def test_get_template_by_slug(self):
        """Test GET /api/occasion-boxes/{slug} returns template"""
        response = requests.get(f"{BASE_URL}/api/occasion-boxes/birthday-box")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data["slug"] == "birthday-box", f"Expected slug 'birthday-box'"
        print(f"✓ Template by slug loaded: {data['name']}")
    
    def test_get_all_active_templates(self):
        """Test GET /api/occasion-boxes returns all active templates"""
        response = requests.get(f"{BASE_URL}/api/occasion-boxes")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "templates" in data, "Response should contain 'templates'"
        templates = data["templates"]
        assert isinstance(templates, list), "Templates should be a list"
        
        # Should have at least birthday and gotcha day templates
        template_types = [t["occasion_type"] for t in templates]
        assert "birthday" in template_types, "Should have birthday template"
        assert "gotcha_day" in template_types, "Should have gotcha_day template"
        
        print(f"✓ Found {len(templates)} active templates: {template_types}")
    
    def test_nonexistent_occasion_returns_404(self):
        """Test GET /api/occasion-boxes/by-occasion/invalid returns 404"""
        response = requests.get(f"{BASE_URL}/api/occasion-boxes/by-occasion/invalid_occasion")
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Invalid occasion correctly returns 404")


class TestMemberLogin:
    """Test member login and pets API"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token for member"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "dipali@clubconcierge.in", "password": "test123"}
        )
        assert response.status_code == 200, f"Login failed: {response.status_code}"
        return response.json()["access_token"]
    
    def test_member_login(self, auth_token):
        """Test member can login successfully"""
        assert auth_token is not None
        assert len(auth_token) > 0
        print("✓ Member login successful")
    
    def test_get_member_pets(self, auth_token):
        """Test GET /api/pets/my-pets returns pets with celebrations"""
        response = requests.get(
            f"{BASE_URL}/api/pets/my-pets",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "pets" in data, "Response should contain 'pets'"
        pets = data["pets"]
        assert len(pets) > 0, "User should have at least one pet"
        
        # Check for pets with birthdays or gotcha days
        pets_with_celebrations = [
            p for p in pets 
            if p.get("birth_date") or p.get("gotcha_date")
        ]
        
        print(f"✓ Found {len(pets)} pets, {len(pets_with_celebrations)} with celebrations")
        
        for pet in pets_with_celebrations[:3]:
            print(f"  - {pet['name']}: birth={pet.get('birth_date')}, gotcha={pet.get('gotcha_date')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
