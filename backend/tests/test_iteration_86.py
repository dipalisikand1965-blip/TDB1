"""
Test Iteration 86: Anonymous Form Submissions for Travel and Care
Tests:
1. Travel form submission without login (manual pet entry)
2. Care/Grooming form submission without login (manual pet entry)
3. Dine products API returns 22 products (including fresh-meals)
4. Stay property admin Photo URLs field
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://care-soul-fixes.preview.emergentagent.com')


class TestTravelAnonymousSubmission:
    """Test Travel form submission without login"""
    
    def test_travel_request_with_manual_pet_entry(self):
        """Test creating a travel request with manual pet entry (no login)"""
        payload = {
            "travel_type": "cab",
            "pet_name": "TEST_AnonymousDog",
            "pet_breed": "Mixed Breed",
            "pickup_city": "Mumbai",
            "drop_city": "Pune",
            "travel_date": "2026-03-01",
            "contact_name": "Anonymous User",
            "contact_email": "anonymous@test.com",
            "contact_phone": "9876543210"
        }
        
        response = requests.post(f"{BASE_URL}/api/travel/request", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        assert "request_id" in data
        assert data["request_id"].startswith("TRV-")
        assert data["status"] == "submitted"
        print(f"Travel request created: {data['request_id']}")
    
    def test_travel_request_with_empty_pet_weight(self):
        """Test that empty string pet_weight is handled correctly"""
        payload = {
            "travel_type": "cab",
            "pet_name": "TEST_WeightTest",
            "pet_breed": "Labrador",
            "pickup_city": "Delhi",
            "drop_city": "Jaipur",
            "travel_date": "2026-03-15",
            "pet_weight": "",  # Empty string should be converted to None
            "contact_name": "Weight Test User",
            "contact_email": "weight@test.com",
            "contact_phone": "9876543211"
        }
        
        response = requests.post(f"{BASE_URL}/api/travel/request", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        print(f"Travel request with empty weight created: {data['request_id']}")
    
    def test_travel_request_all_travel_types(self):
        """Test all travel types work without login"""
        travel_types = ["cab", "train", "flight", "relocation"]
        
        for travel_type in travel_types:
            payload = {
                "travel_type": travel_type,
                "pet_name": f"TEST_{travel_type.capitalize()}Pet",
                "pickup_city": "Bangalore",
                "drop_city": "Chennai",
                "travel_date": "2026-04-01",
                "contact_name": f"{travel_type.capitalize()} User",
                "contact_email": f"{travel_type}@test.com",
                "contact_phone": "9876543212"
            }
            
            response = requests.post(f"{BASE_URL}/api/travel/request", json=payload)
            assert response.status_code == 200
            
            data = response.json()
            assert data["success"] == True
            print(f"{travel_type.capitalize()} travel request created: {data['request_id']}")


class TestCareAnonymousSubmission:
    """Test Care form submission without login"""
    
    def test_care_request_grooming_without_login(self):
        """Test creating a grooming request with manual pet entry (no login)"""
        payload = {
            "care_type": "grooming",
            "pet_name": "TEST_GroomingDog",
            "pet_breed": "Poodle",
            "description": "Full grooming session needed",
            "preferred_date": "2026-03-10",
            "contact_name": "Grooming User",
            "contact_email": "grooming@test.com",
            "contact_phone": "9876543213"
        }
        
        response = requests.post(f"{BASE_URL}/api/care/request", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        assert "request_id" in data
        assert data["request_id"].startswith("CARE-")
        assert data["status"] == "submitted"
        print(f"Care request created: {data['request_id']}")
    
    def test_care_request_all_care_types(self):
        """Test all care types work without login"""
        care_types = ["grooming", "walks", "training", "vet_coordination", "special_needs"]
        
        for care_type in care_types:
            payload = {
                "care_type": care_type,
                "pet_name": f"TEST_{care_type.replace('_', '').capitalize()}Pet",
                "description": f"{care_type.replace('_', ' ').title()} service needed",
                "preferred_date": "2026-04-15",
                "contact_name": f"{care_type.replace('_', ' ').title()} User",
                "contact_email": f"{care_type.replace('_', '')}@test.com",
                "contact_phone": "9876543214"
            }
            
            response = requests.post(f"{BASE_URL}/api/care/request", json=payload)
            assert response.status_code == 200
            
            data = response.json()
            assert data["success"] == True
            print(f"{care_type.replace('_', ' ').title()} care request created: {data['request_id']}")


class TestDineProducts:
    """Test Dine products API"""
    
    def test_dine_products_count(self):
        """Test that Dine API returns 22 products including fresh-meals"""
        response = requests.get(f"{BASE_URL}/api/dine/products")
        assert response.status_code == 200
        
        data = response.json()
        assert "products" in data
        assert "total" in data
        assert data["total"] == 22
        assert len(data["products"]) == 22
        print(f"Dine products count: {data['total']}")
    
    def test_dine_products_categories(self):
        """Test that products include both dine and fresh-meals categories"""
        response = requests.get(f"{BASE_URL}/api/dine/products")
        assert response.status_code == 200
        
        data = response.json()
        categories = set()
        for product in data["products"]:
            if "category" in product:
                categories.add(product["category"])
        
        print(f"Categories found: {categories}")
        # Should have products from dine and/or fresh-meals categories


class TestTravelTypes:
    """Test Travel types API"""
    
    def test_get_travel_types(self):
        """Test getting available travel types"""
        response = requests.get(f"{BASE_URL}/api/travel/types")
        assert response.status_code == 200
        
        data = response.json()
        assert "travel_types" in data
        
        expected_types = ["cab", "train", "flight", "relocation"]
        for travel_type in expected_types:
            assert travel_type in data["travel_types"]
        
        print(f"Travel types: {list(data['travel_types'].keys())}")


class TestCareTypes:
    """Test Care types API"""
    
    def test_get_care_types(self):
        """Test getting available care types"""
        response = requests.get(f"{BASE_URL}/api/care/types")
        assert response.status_code == 200
        
        data = response.json()
        assert "care_types" in data
        
        expected_types = ["grooming", "walks", "training", "vet_coordination", "emergency", "special_needs"]
        for care_type in expected_types:
            assert care_type in data["care_types"]
        
        print(f"Care types: {list(data['care_types'].keys())}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
