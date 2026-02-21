"""
E042: Local Places Integration Tests
Tests the Google Places API integration for finding dog parks, pet stores, vets, and groomers.
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestLocalPlacesMain:
    """Test the main /api/mira/local-places endpoint"""
    
    def test_local_places_default_city(self):
        """Test local places with default city (Mumbai)"""
        response = requests.get(f"{BASE_URL}/api/mira/local-places")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Validate response structure
        assert data.get("success") == True, f"Expected success=True, got: {data}"
        assert "places" in data, "Response should contain 'places' field"
        assert data.get("city") == "Mumbai", f"Expected city=Mumbai, got: {data.get('city')}"
        
        # Should return all place types by default
        places = data.get("places", {})
        expected_types = ["dog_parks", "pet_stores", "vets", "groomers"]
        for place_type in expected_types:
            assert place_type in places, f"Missing {place_type} in response"
        
        print(f"TEST PASS: Default city returns {data.get('total_places', 0)} places across all categories")
    
    def test_local_places_mumbai_with_limit(self):
        """Test local places in Mumbai with limit parameter"""
        response = requests.get(f"{BASE_URL}/api/mira/local-places?city=Mumbai&limit=5")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        assert data.get("success") == True
        assert data.get("city") == "Mumbai"
        
        # Check that places are returned
        places = data.get("places", {})
        total_count = sum(cat.get("count", 0) for cat in places.values())
        print(f"TEST PASS: Mumbai returned {total_count} total places")
        
    def test_local_places_delhi(self):
        """Test local places in Delhi"""
        response = requests.get(f"{BASE_URL}/api/mira/local-places?city=Delhi&limit=5")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("success") == True
        assert data.get("city") == "Delhi"
        print(f"TEST PASS: Delhi search successful - {data.get('total_places', 0)} places found")
    
    def test_local_places_bangalore(self):
        """Test local places in Bangalore"""
        response = requests.get(f"{BASE_URL}/api/mira/local-places?city=Bangalore&limit=5")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("success") == True
        assert "places" in data
        print(f"TEST PASS: Bangalore search successful")
    
    def test_local_places_specific_type_dog_parks(self):
        """Test local places filtered by dog_parks type"""
        response = requests.get(f"{BASE_URL}/api/mira/local-places?city=Mumbai&place_type=dog_parks&limit=5")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("success") == True
        places = data.get("places", {})
        
        # Should only have dog_parks
        assert "dog_parks" in places, "Should return dog_parks"
        # Other types should not be present when filtered
        assert "pet_stores" not in places, "Should not return pet_stores when type=dog_parks"
        
        print(f"TEST PASS: Dog parks filter works - {places.get('dog_parks', {}).get('count', 0)} parks found")


class TestLocalPlacesVets:
    """Test /api/mira/local-places/vets endpoint"""
    
    def test_vets_in_delhi(self):
        """Test veterinary clinics in Delhi"""
        response = requests.get(f"{BASE_URL}/api/mira/local-places/vets?city=Delhi")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert data.get("success") == True
        assert "vets" in data
        assert data.get("city") == "Delhi"
        
        vets = data.get("vets", [])
        print(f"TEST PASS: Delhi vets - Found {len(vets)} veterinary clinics")
        
        # Validate vet structure if any found
        if vets:
            vet = vets[0]
            assert "name" in vet, "Vet should have name"
            print(f"  - Sample vet: {vet.get('name')}")
    
    def test_emergency_vets(self):
        """Test emergency vet search"""
        response = requests.get(f"{BASE_URL}/api/mira/local-places/vets?city=Mumbai&emergency=true")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("success") == True
        assert data.get("emergency_search") == True
        print(f"TEST PASS: Emergency vet search - {data.get('count', 0)} results")


class TestLocalPlacesDogParks:
    """Test /api/mira/local-places/dog-parks endpoint"""
    
    def test_dog_parks_bangalore(self):
        """Test dog parks in Bangalore"""
        response = requests.get(f"{BASE_URL}/api/mira/local-places/dog-parks?city=Bangalore")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert data.get("success") == True
        assert "dog_parks" in data
        assert data.get("city") == "Bangalore"
        
        parks = data.get("dog_parks", [])
        print(f"TEST PASS: Bangalore dog parks - Found {len(parks)} parks")
        
        # Validate park structure if any found
        if parks:
            park = parks[0]
            assert "name" in park, "Park should have name"
            print(f"  - Sample park: {park.get('name')}")


class TestLocalPlacesPetStores:
    """Test /api/mira/local-places/pet-stores endpoint"""
    
    def test_pet_stores_chennai(self):
        """Test pet stores in Chennai"""
        response = requests.get(f"{BASE_URL}/api/mira/local-places/pet-stores?city=Chennai")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert data.get("success") == True
        assert "pet_stores" in data
        assert data.get("city") == "Chennai"
        
        stores = data.get("pet_stores", [])
        print(f"TEST PASS: Chennai pet stores - Found {len(stores)} stores")
        
        # Validate store structure if any found
        if stores:
            store = stores[0]
            assert "name" in store, "Store should have name"
            print(f"  - Sample store: {store.get('name')}")


class TestLocalPlacesGroomers:
    """Test /api/mira/local-places/groomers endpoint"""
    
    def test_groomers_hyderabad(self):
        """Test groomers in Hyderabad"""
        response = requests.get(f"{BASE_URL}/api/mira/local-places/groomers?city=Hyderabad")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert data.get("success") == True
        assert "groomers" in data
        assert data.get("city") == "Hyderabad"
        
        groomers = data.get("groomers", [])
        print(f"TEST PASS: Hyderabad groomers - Found {len(groomers)} groomers")


class TestLocalPlacesDataStructure:
    """Test data structure and fields returned by local places APIs"""
    
    def test_place_item_structure(self):
        """Verify place items have expected fields"""
        response = requests.get(f"{BASE_URL}/api/mira/local-places?city=Mumbai&limit=3")
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        
        # Check any returned place for structure
        places = data.get("places", {})
        for place_type, category in places.items():
            items = category.get("items", [])
            if items:
                item = items[0]
                # Required fields
                assert "id" in item or "name" in item, f"Place should have id or name: {item}"
                assert "name" in item, f"Place should have name field: {item}"
                
                # Optional but expected fields
                expected_fields = ["address", "rating", "latitude", "longitude", "source"]
                present_fields = [f for f in expected_fields if f in item]
                print(f"  {place_type}: {item.get('name')} - has fields: {present_fields}")
        
        print("TEST PASS: Place items have expected structure")
    
    def test_response_metadata(self):
        """Test response contains proper metadata"""
        response = requests.get(f"{BASE_URL}/api/mira/local-places?city=Mumbai&limit=5")
        
        assert response.status_code == 200
        data = response.json()
        
        # Check metadata fields
        assert "success" in data
        assert "city" in data
        assert "source" in data
        assert data.get("source") == "google_places", f"Expected google_places source, got: {data.get('source')}"
        
        print("TEST PASS: Response metadata is correct")


class TestLocalPlacesInternational:
    """Test international city support"""
    
    def test_places_pune(self):
        """Test places in Pune (India)"""
        response = requests.get(f"{BASE_URL}/api/mira/local-places?city=Pune&limit=3")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("success") == True
        print(f"TEST PASS: Pune search - {data.get('total_places', 0)} places found")
    
    def test_places_kolkata(self):
        """Test places in Kolkata (India)"""
        response = requests.get(f"{BASE_URL}/api/mira/local-places?city=Kolkata&limit=3")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("success") == True
        print(f"TEST PASS: Kolkata search - {data.get('total_places', 0)} places found")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
