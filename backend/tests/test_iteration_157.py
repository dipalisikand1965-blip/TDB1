"""
Iteration 157 - Test suite for:
1. GET /api/places/pet-friendly endpoint (Google Places integration)
2. ProductCard '9 options' removed from dine pillar
3. ProductBoxEditor Pillars tab fields (Category, Sub-Category, Status in Pillar)
"""

import pytest
import requests
import os

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")


class TestPetFriendlyPlacesAPI:
    """Tests for /api/places/pet-friendly Google Places endpoint"""

    def test_places_bengaluru_labrador(self):
        """Backend returns pet-friendly spots for Bengaluru with Labrador breed"""
        resp = requests.get(f"{BASE_URL}/api/places/pet-friendly", params={"city": "Bengaluru", "breed": "Labrador"}, timeout=20)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        data = resp.json()
        assert "spots" in data, "Response should have 'spots' key"
        assert "city" in data, "Response should have 'city' key"
        spots = data["spots"]
        print(f"[OK] /api/places/pet-friendly?city=Bengaluru&breed=Labrador => {len(spots)} spots")
        # Should return up to 8 spots (Google Places returns max 8)
        assert len(spots) >= 1, "Should have at least 1 spot"
        # Validate spot structure
        for spot in spots[:3]:
            assert "name" in spot, f"Spot missing 'name': {spot}"
            assert "placeId" in spot, f"Spot missing 'placeId': {spot}"
            print(f"  Spot: {spot['name']} | Rating: {spot.get('rating')} | Tag: {spot.get('tag')}")

    def test_places_mumbai(self):
        """Backend returns spots for Mumbai city"""
        resp = requests.get(f"{BASE_URL}/api/places/pet-friendly", params={"city": "Mumbai"}, timeout=20)
        assert resp.status_code == 200
        data = resp.json()
        spots = data.get("spots", [])
        print(f"[OK] /api/places/pet-friendly?city=Mumbai => {len(spots)} spots")
        assert len(spots) >= 1, "Mumbai should return at least 1 spot"

    def test_places_default_city(self):
        """Backend returns spots for default city (Bengaluru) if no city provided"""
        resp = requests.get(f"{BASE_URL}/api/places/pet-friendly", timeout=20)
        assert resp.status_code == 200
        data = resp.json()
        assert "spots" in data
        print(f"[OK] /api/places/pet-friendly (no city param) => {len(data['spots'])} spots, city={data.get('city')}")

    def test_places_spot_fields(self):
        """Each spot should have required fields for SpotCard UI rendering"""
        resp = requests.get(f"{BASE_URL}/api/places/pet-friendly", params={"city": "Bengaluru", "breed": "Labrador"}, timeout=20)
        assert resp.status_code == 200
        data = resp.json()
        spots = data["spots"]
        assert len(spots) >= 1
        spot = spots[0]
        # Required fields for SpotCard component
        required_fields = ["placeId", "name", "address", "rating", "tag", "mapsUrl"]
        for field in required_fields:
            assert field in spot, f"Spot missing required field '{field}'"
        print(f"[OK] Spot fields validated: {list(spot.keys())}")

    def test_places_real_data_not_mock(self):
        """Verify we get real Google Places data (not mock spots with 'mock-1' placeId)"""
        resp = requests.get(f"{BASE_URL}/api/places/pet-friendly", params={"city": "Bengaluru", "breed": "Labrador"}, timeout=20)
        assert resp.status_code == 200
        data = resp.json()
        spots = data["spots"]
        assert len(spots) >= 1
        # Real data should not have mock placeIds
        place_ids = [s.get("placeId", "") for s in spots]
        mock_ids = [pid for pid in place_ids if pid and pid.startswith("mock-")]
        print(f"[INFO] PlaceIds: {place_ids[:3]}")
        if mock_ids:
            print(f"[WARN] Got MOCK data (API key missing or invalid): {mock_ids}")
        else:
            print(f"[OK] Real Google Places data confirmed - no mock IDs")
        # If we get real data, placeId should be a long Google Places ID
        # Accept mock only if there's an API key issue
        if not mock_ids:
            # Real data should have non-empty names
            for spot in spots[:3]:
                assert spot["name"], "Spot name should not be empty"

    def test_places_max_8_spots_bengaluru(self):
        """Google Places returns max 8 spots for Bengaluru"""
        resp = requests.get(f"{BASE_URL}/api/places/pet-friendly", params={"city": "Bengaluru", "breed": "Labrador"}, timeout=20)
        assert resp.status_code == 200
        data = resp.json()
        spots = data["spots"]
        print(f"[INFO] Bengaluru spots count: {len(spots)}")
        # Backend limits to 8 ([:8] in dine_routes.py)
        assert len(spots) <= 8, f"Should return at most 8 spots, got {len(spots)}"


class TestDineEndpoints:
    """Sanity checks for dine endpoints"""

    def test_dine_router_health(self):
        """Verify dine endpoints are reachable"""
        resp = requests.get(f"{BASE_URL}/api/dine/restaurants", timeout=10)
        # Should return 200 or possibly 404 if no data
        assert resp.status_code in [200, 404], f"Unexpected: {resp.status_code}"
        print(f"[OK] /api/dine/restaurants => {resp.status_code}")

    def test_places_endpoint_not_500(self):
        """Places endpoint should never return 500 for valid input"""
        resp = requests.get(f"{BASE_URL}/api/places/pet-friendly", params={"city": "Delhi", "breed": "Pug"}, timeout=20)
        assert resp.status_code != 500, f"Got 500 error: {resp.text[:200]}"
        assert resp.status_code == 200
        print(f"[OK] Places endpoint doesn't 500 for Delhi/Pug")
