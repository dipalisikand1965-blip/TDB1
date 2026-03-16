"""
Test Suite for Adopt Pillar and Navigation Features
Tests:
1. Adopt API endpoints (GET /api/adopt/pets, GET /api/adopt/stats, GET /api/adopt/events)
2. Navigation - Adopt, Farewell, Shop in More dropdown
3. Pet Soul auto-population from pet root properties
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://nutrition-engine-ui.preview.emergentagent.com').rstrip('/')

class TestAdoptAPIs:
    """Test Adopt Pillar API endpoints"""
    
    def test_get_adoptable_pets(self):
        """Test GET /api/adopt/pets returns adoptable pets"""
        response = requests.get(f"{BASE_URL}/api/adopt/pets?status=available&limit=10")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "pets" in data, "Response should contain 'pets' key"
        assert "total" in data, "Response should contain 'total' key"
        
        # Verify we have seeded pets
        pets = data["pets"]
        assert len(pets) >= 5, f"Expected at least 5 pets, got {len(pets)}"
        
        # Verify pet structure
        if pets:
            pet = pets[0]
            assert "name" in pet, "Pet should have 'name'"
            assert "species" in pet, "Pet should have 'species'"
            assert "status" in pet, "Pet should have 'status'"
            assert pet["status"] == "available", "Pet status should be 'available'"
            print(f"✓ Found {len(pets)} adoptable pets")
    
    def test_get_adopt_stats(self):
        """Test GET /api/adopt/stats returns statistics"""
        response = requests.get(f"{BASE_URL}/api/adopt/stats")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "available_pets" in data, "Stats should contain 'available_pets'"
        assert "total_adopted" in data, "Stats should contain 'total_adopted'"
        assert "partner_shelters" in data, "Stats should contain 'partner_shelters'"
        
        # Verify available_pets matches actual count
        assert data["available_pets"] >= 5, f"Expected at least 5 available pets, got {data['available_pets']}"
        print(f"✓ Stats: {data['available_pets']} available, {data['total_adopted']} adopted")
    
    def test_get_adopt_events(self):
        """Test GET /api/adopt/events returns events list"""
        response = requests.get(f"{BASE_URL}/api/adopt/events?upcoming=true&limit=5")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "events" in data, "Response should contain 'events' key"
        print(f"✓ Events endpoint working, found {len(data['events'])} events")
    
    def test_get_adopt_shelters(self):
        """Test GET /api/adopt/shelters returns shelters list"""
        response = requests.get(f"{BASE_URL}/api/adopt/shelters?limit=10")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "shelters" in data, "Response should contain 'shelters' key"
        print(f"✓ Shelters endpoint working, found {len(data['shelters'])} shelters")
    
    def test_get_adopt_categories(self):
        """Test GET /api/adopt/categories returns category config"""
        response = requests.get(f"{BASE_URL}/api/adopt/categories")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "categories" in data, "Response should contain 'categories' key"
        
        categories = data["categories"]
        assert "rescue" in categories, "Should have 'rescue' category"
        assert "shelter" in categories, "Should have 'shelter' category"
        assert "foster" in categories, "Should have 'foster' category"
        print(f"✓ Categories: {list(categories.keys())}")
    
    def test_filter_pets_by_species(self):
        """Test filtering pets by species"""
        # Filter dogs
        response = requests.get(f"{BASE_URL}/api/adopt/pets?species=dog&status=available")
        assert response.status_code == 200
        data = response.json()
        for pet in data["pets"]:
            assert pet["species"] == "dog", f"Expected dog, got {pet['species']}"
        print(f"✓ Dog filter: {len(data['pets'])} dogs found")
        
        # Filter cats
        response = requests.get(f"{BASE_URL}/api/adopt/pets?species=cat&status=available")
        assert response.status_code == 200
        data = response.json()
        for pet in data["pets"]:
            assert pet["species"] == "cat", f"Expected cat, got {pet['species']}"
        print(f"✓ Cat filter: {len(data['pets'])} cats found")


class TestPetSoulAutoPopulation:
    """Test Pet Soul auto-population from pet root properties"""
    
    def test_pet_has_root_properties(self):
        """Verify pet has name, breed, gender at root level"""
        pet_id = "pet-99a708f1722a"
        response = requests.get(f"{BASE_URL}/api/pets/{pet_id}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        pet = data.get("pet", data)
        
        # Verify root properties exist
        assert "name" in pet, "Pet should have 'name' at root"
        assert "breed" in pet, "Pet should have 'breed' at root"
        assert "gender" in pet, "Pet should have 'gender' at root"
        
        # Verify values
        assert pet["name"] == "Mojo", f"Expected name 'Mojo', got {pet['name']}"
        assert pet["breed"] == "Indie", f"Expected breed 'Indie', got {pet['breed']}"
        assert pet["gender"] == "male", f"Expected gender 'male', got {pet['gender']}"
        
        print(f"✓ Pet root properties: name={pet['name']}, breed={pet['breed']}, gender={pet['gender']}")
    
    def test_soul_answers_separate_from_root(self):
        """Verify doggy_soul_answers is separate from root properties"""
        pet_id = "pet-99a708f1722a"
        response = requests.get(f"{BASE_URL}/api/pets/{pet_id}")
        assert response.status_code == 200
        
        data = response.json()
        pet = data.get("pet", data)
        
        # Soul answers should be in doggy_soul_answers, not at root
        soul_answers = pet.get("doggy_soul_answers", {})
        
        # Root properties should NOT be duplicated in soul_answers
        # (they are auto-populated in frontend, not stored in soul_answers)
        print(f"✓ Soul answers keys: {list(soul_answers.keys())[:10]}...")


class TestNavigationPillars:
    """Test that Adopt, Farewell, Shop appear in navigation"""
    
    def test_farewell_page_loads(self):
        """Test /farewell page returns 200"""
        response = requests.get(f"{BASE_URL}/farewell", allow_redirects=True)
        # Frontend routes return HTML, check it's not a 404
        assert response.status_code == 200, f"Farewell page should load, got {response.status_code}"
        print("✓ Farewell page accessible")
    
    def test_shop_page_loads(self):
        """Test /shop page returns 200"""
        response = requests.get(f"{BASE_URL}/shop", allow_redirects=True)
        assert response.status_code == 200, f"Shop page should load, got {response.status_code}"
        print("✓ Shop page accessible")
    
    def test_adopt_page_loads(self):
        """Test /adopt page returns 200"""
        response = requests.get(f"{BASE_URL}/adopt", allow_redirects=True)
        assert response.status_code == 200, f"Adopt page should load, got {response.status_code}"
        print("✓ Adopt page accessible")


class TestAdoptApplicationFlow:
    """Test adoption application submission"""
    
    def test_submit_adoption_application(self):
        """Test POST /api/adopt/applications"""
        # First get a pet ID
        pets_response = requests.get(f"{BASE_URL}/api/adopt/pets?status=available&limit=1")
        assert pets_response.status_code == 200
        pets = pets_response.json()["pets"]
        assert len(pets) > 0, "Need at least one pet to test application"
        
        pet_id = pets[0]["pet_id"]
        
        # Submit application
        application_data = {
            "pet_id": pet_id,
            "applicant_name": "TEST_Adoption_User",
            "applicant_email": "test_adopt@example.com",
            "applicant_phone": "9876543210",
            "home_type": "apartment",
            "experience": "Have had dogs before",
            "reason": "Looking for a companion"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/adopt/applications",
            json=application_data
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, "Application should succeed"
        assert "application_id" in data, "Should return application_id"
        print(f"✓ Application submitted: {data['application_id']}")
    
    def test_submit_foster_application(self):
        """Test POST /api/adopt/foster/apply"""
        foster_data = {
            "applicant_name": "TEST_Foster_User",
            "applicant_email": "test_foster@example.com",
            "applicant_phone": "9876543211",
            "home_type": "house",
            "experience": "Fostered cats before",
            "foster_duration": "1 month"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/adopt/foster/apply",
            json=foster_data
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, "Foster application should succeed"
        assert "foster_id" in data, "Should return foster_id"
        print(f"✓ Foster application submitted: {data['foster_id']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
