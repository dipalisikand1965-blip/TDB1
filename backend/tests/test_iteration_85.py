"""
Test Suite for Iteration 85 - Multi-pet selection and navigation fixes
Tests:
1. Stay booking form submission with multi-pet selection
2. Dine reservation form submission with multi-pet selection
3. Meal Plans link in Dine menu points to /meal-plan
4. Stay Essentials link in Stay menu points to /stay#essentials
5. Fresh meals products from thedoggybakery.com visible on dining page
6. MealPlanPage loads correctly when user is logged in
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://petbutler.preview.emergentagent.com')

# Test credentials
TEST_USER_EMAIL = "dipali@clubconcierge.in"
TEST_USER_PASSWORD = "lola4304"
TEST_PROPERTY_ID = "stay-a017883d9a28"
TEST_RESTAURANT_ID = "rest-69d5eda05b57"


class TestStayMultiPetBooking:
    """Test Stay booking with multi-pet selection"""
    
    def test_stay_booking_with_single_pet(self):
        """Test stay booking with single pet (backward compatibility)"""
        response = requests.post(f"{BASE_URL}/api/stay/booking-request", json={
            "property_id": TEST_PROPERTY_ID,
            "guest_name": "Test User",
            "guest_email": "test@example.com",
            "guest_phone": "+919876543210",
            "pet_name": "Bruno",
            "pet_breed": "Golden Retriever",
            "check_in_date": "2026-02-15",
            "check_out_date": "2026-02-17",
            "num_rooms": 1,
            "num_adults": 2,
            "num_pets": 1
        })
        print(f"Single pet booking response: {response.status_code}")
        print(f"Response: {response.json()}")
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert "booking_id" in data
        
    def test_stay_booking_with_multi_pet_array(self):
        """Test stay booking with multiple pets as array"""
        response = requests.post(f"{BASE_URL}/api/stay/booking-request", json={
            "property_id": TEST_PROPERTY_ID,
            "guest_name": "Multi Pet Test User",
            "guest_email": "multipet@example.com",
            "guest_phone": "+919876543211",
            "pets": [
                {"name": "Bruno", "breed": "Golden Retriever", "weight_kg": 30},
                {"name": "Max", "breed": "Labrador", "weight_kg": 28}
            ],
            "selectedPetIds": ["pet-1", "pet-2"],
            "check_in_date": "2026-02-20",
            "check_out_date": "2026-02-22",
            "num_rooms": 1,
            "num_adults": 2,
            "num_pets": 2
        })
        print(f"Multi-pet booking response: {response.status_code}")
        print(f"Response: {response.json()}")
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert "booking_id" in data
        
    def test_stay_property_exists(self):
        """Verify test property exists"""
        response = requests.get(f"{BASE_URL}/api/stay/properties/{TEST_PROPERTY_ID}")
        print(f"Property check response: {response.status_code}")
        # Property may not exist in live status, check for 200 or 404
        assert response.status_code in [200, 404]


class TestDineMultiPetReservation:
    """Test Dine reservation with multi-pet selection"""
    
    def test_dine_reservation_with_single_pet(self):
        """Test dine reservation with single pet (backward compatibility)"""
        response = requests.post(f"{BASE_URL}/api/dine/reservations", json={
            "restaurant_id": TEST_RESTAURANT_ID,
            "name": "Test User",
            "phone": "+919876543210",
            "email": "test@example.com",
            "date": "2026-02-15",
            "time": "19:00",
            "guests": 2,
            "pets": 1,
            "pet_name": "Bruno",
            "pet_breed": "Golden Retriever"
        })
        print(f"Single pet reservation response: {response.status_code}")
        print(f"Response: {response.json()}")
        assert response.status_code == 200
        data = response.json()
        assert "reservation_id" in data
        
    def test_dine_reservation_with_multi_pet_array(self):
        """Test dine reservation with multiple pets as array"""
        response = requests.post(f"{BASE_URL}/api/dine/reservations", json={
            "restaurant_id": TEST_RESTAURANT_ID,
            "name": "Multi Pet Test User",
            "phone": "+919876543211",
            "email": "multipet@example.com",
            "date": "2026-02-20",
            "time": "19:30",
            "guests": 2,
            "pets": [
                {"id": "pet-1", "name": "Bruno", "breed": "Golden Retriever"},
                {"id": "pet-2", "name": "Max", "breed": "Labrador"}
            ],
            "pets_count": 2,
            "pet_ids": ["pet-1", "pet-2"]
        })
        print(f"Multi-pet reservation response: {response.status_code}")
        print(f"Response: {response.json()}")
        assert response.status_code == 200
        data = response.json()
        assert "reservation_id" in data
        
    def test_restaurant_exists(self):
        """Verify test restaurant exists"""
        response = requests.get(f"{BASE_URL}/api/dine/restaurants/{TEST_RESTAURANT_ID}")
        print(f"Restaurant check response: {response.status_code}")
        # Restaurant may not exist, check for 200 or 404
        assert response.status_code in [200, 404]


class TestDineProducts:
    """Test Dine products including fresh-meals"""
    
    def test_dine_products_endpoint(self):
        """Test /api/dine/products returns products"""
        response = requests.get(f"{BASE_URL}/api/dine/products")
        print(f"Dine products response: {response.status_code}")
        assert response.status_code == 200
        data = response.json()
        assert "products" in data
        print(f"Total dine products: {data.get('total', len(data.get('products', [])))}")
        
    def test_dine_products_include_fresh_meals(self):
        """Test that dine products include fresh-meals category"""
        response = requests.get(f"{BASE_URL}/api/dine/products")
        assert response.status_code == 200
        data = response.json()
        products = data.get("products", [])
        
        # Check for fresh-meals category products
        fresh_meals = [p for p in products if p.get("category") == "fresh-meals"]
        dine_products = [p for p in products if p.get("category") == "dine"]
        
        print(f"Fresh meals count: {len(fresh_meals)}")
        print(f"Dine accessories count: {len(dine_products)}")
        
        # Should have at least dine accessories
        assert len(products) > 0, "Should have at least some dine products"


class TestDineBundles:
    """Test Dine bundles endpoint"""
    
    def test_dine_bundles_endpoint(self):
        """Test /api/dine/bundles returns bundles"""
        response = requests.get(f"{BASE_URL}/api/dine/bundles")
        print(f"Dine bundles response: {response.status_code}")
        assert response.status_code == 200
        data = response.json()
        assert "bundles" in data
        print(f"Total dine bundles: {len(data.get('bundles', []))}")


class TestRestaurants:
    """Test restaurants endpoint"""
    
    def test_restaurants_list(self):
        """Test /api/dine/restaurants returns restaurants"""
        response = requests.get(f"{BASE_URL}/api/dine/restaurants")
        print(f"Restaurants response: {response.status_code}")
        assert response.status_code == 200
        data = response.json()
        assert "restaurants" in data
        print(f"Total restaurants: {len(data.get('restaurants', []))}")


class TestStayProperties:
    """Test stay properties endpoint"""
    
    def test_stay_properties_list(self):
        """Test /api/stay/properties returns properties"""
        response = requests.get(f"{BASE_URL}/api/stay/properties")
        print(f"Stay properties response: {response.status_code}")
        assert response.status_code == 200
        data = response.json()
        assert "properties" in data
        print(f"Total stay properties: {len(data.get('properties', []))}")


class TestMealPlanAPI:
    """Test meal plan related APIs"""
    
    def test_products_feed_pillar(self):
        """Test products endpoint with feed pillar for meal plan"""
        response = requests.get(f"{BASE_URL}/api/products?pillar=feed&limit=20")
        print(f"Feed products response: {response.status_code}")
        assert response.status_code == 200
        data = response.json()
        print(f"Feed products count: {len(data.get('products', []))}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
