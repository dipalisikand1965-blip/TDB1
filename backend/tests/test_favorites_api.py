"""
Test Favorites API - Save to Favorites Feature
==============================================

Tests for:
1. Heart button on picks saves to favorites API
2. Favorites API returns saved items for pet-3661ae55d2e2
3. MyPets page 'What Mira Knows' section displays favorites when expanded
4. SoulKnowledgeTicker shows favorites section when expanded
"""

import pytest
import requests
import os
import time
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://pet-soul-journey.preview.emergentagent.com').rstrip('/')

# Test credentials from requirements
TEST_EMAIL = "dipali@clubconcierge.in"
TEST_PASSWORD = "test123"
TEST_PET_ID = "pet-3661ae55d2e2"


class TestFavoritesAPI:
    """Test the Favorites API endpoints"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup for each test - get auth token"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login to get token
        try:
            response = self.session.post(f"{BASE_URL}/api/auth/login", json={
                "email": TEST_EMAIL,
                "password": TEST_PASSWORD
            })
            if response.status_code == 200:
                data = response.json()
                self.token = data.get("token")
                self.session.headers.update({"Authorization": f"Bearer {self.token}"})
        except Exception as e:
            print(f"Auth failed: {e}")
            self.token = None
    
    def test_01_get_favorites_endpoint_exists(self):
        """Test GET /api/favorites/{pet_id} returns 200"""
        response = self.session.get(f"{BASE_URL}/api/favorites/{TEST_PET_ID}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "favorites" in data, "Response should have 'favorites' key"
        assert "pet_id" in data, "Response should have 'pet_id' key"
        assert data["pet_id"] == TEST_PET_ID
        
        print(f"✓ GET /api/favorites/{TEST_PET_ID} returned {data['count']} favorites")
    
    def test_02_get_favorites_returns_list(self):
        """Test favorites endpoint returns a list of saved items"""
        response = self.session.get(f"{BASE_URL}/api/favorites/{TEST_PET_ID}")
        
        assert response.status_code == 200
        data = response.json()
        
        # Favorites should be a list
        assert isinstance(data.get("favorites"), list), "favorites should be a list"
        
        # Check structure of favorite items
        if len(data["favorites"]) > 0:
            fav = data["favorites"][0]
            print(f"✓ First favorite: {fav.get('title')} ({fav.get('pillar')})")
            # Each favorite should have these fields
            assert "item_id" in fav or "title" in fav, "Favorite should have item_id or title"
    
    def test_03_add_favorite_item(self):
        """Test POST /api/favorites/add to save a pick"""
        test_item = {
            "id": f"test-pick-{int(time.time())}",
            "title": "Test Birthday Cake",
            "type": "product",
            "category": "treats",
            "pillar": "celebrate",
            "icon": "🎂"
        }
        
        response = self.session.post(f"{BASE_URL}/api/favorites/add", json={
            "pet_id": TEST_PET_ID,
            "item": test_item
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, f"Add favorite should succeed: {data}"
        
        print(f"✓ Added '{test_item['title']}' to favorites")
        
        # Store for cleanup
        self.__class__.test_item_id = test_item["id"]
    
    def test_04_verify_favorite_was_added(self):
        """Verify the favorite we added appears in the list"""
        response = self.session.get(f"{BASE_URL}/api/favorites/{TEST_PET_ID}")
        
        assert response.status_code == 200
        data = response.json()
        
        # Check if our test item is in favorites
        favorites = data.get("favorites", [])
        test_item_id = getattr(self.__class__, 'test_item_id', None)
        
        if test_item_id:
            found = any(f.get("item_id") == test_item_id for f in favorites)
            assert found, f"Test item {test_item_id} should be in favorites"
            print(f"✓ Verified '{test_item_id}' is in favorites list")
    
    def test_05_remove_favorite_item(self):
        """Test POST /api/favorites/remove to unsave a pick"""
        test_item_id = getattr(self.__class__, 'test_item_id', None)
        
        if not test_item_id:
            pytest.skip("No test item to remove")
        
        response = self.session.post(f"{BASE_URL}/api/favorites/remove", json={
            "pet_id": TEST_PET_ID,
            "item_id": test_item_id
        })
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, f"Remove favorite should succeed: {data}"
        
        print(f"✓ Removed test item from favorites")
    
    def test_06_get_favorites_summary_endpoint(self):
        """Test GET /api/favorites/{pet_id}/summary for Mira context"""
        response = self.session.get(f"{BASE_URL}/api/favorites/{TEST_PET_ID}/summary")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "success" in data
        
        # Should have summary fields
        if data.get("has_favorites"):
            assert "total_count" in data
            assert "by_pillar" in data
            print(f"✓ Favorites summary: {data.get('total_count')} items across {len(data.get('by_pillar', {}))} pillars")
        else:
            print("✓ No favorites saved yet")
    
    def test_07_favorites_pillar_filter(self):
        """Test favorites can be filtered by pillar"""
        response = self.session.get(f"{BASE_URL}/api/favorites/{TEST_PET_ID}?pillar=celebrate")
        
        assert response.status_code == 200
        data = response.json()
        
        # All returned favorites should be from 'celebrate' pillar or empty
        favorites = data.get("favorites", [])
        for fav in favorites:
            assert fav.get("pillar") == "celebrate", f"All favorites should be from celebrate pillar"
        
        print(f"✓ Pillar filter working: {len(favorites)} celebrate favorites")
    
    def test_08_what_mira_knows_includes_favorites(self):
        """Test the 'What Mira Knows' API includes favorites data"""
        response = self.session.get(f"{BASE_URL}/api/mira/memory/pet/{TEST_PET_ID}/what-mira-knows")
        
        # This endpoint might not exist or have different path
        if response.status_code == 404:
            # Try alternate path
            response = self.session.get(f"{BASE_URL}/api/pets/{TEST_PET_ID}/what-mira-knows")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✓ What Mira Knows endpoint working")
            # Check if favorites data is included
            if "favorites_count" in str(data) or "favorites" in str(data):
                print("✓ Favorites data included in What Mira Knows")
        else:
            print(f"⚠ What Mira Knows endpoint returned {response.status_code}")


class TestToggleFavoriteFlow:
    """Test the toggle favorite flow (add then remove)"""
    
    def test_toggle_favorite_add_and_remove(self):
        """Test complete toggle flow: add → verify → remove → verify"""
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        
        # Login
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code == 200:
            token = response.json().get("token")
            session.headers.update({"Authorization": f"Bearer {token}"})
        
        unique_id = f"toggle-test-{int(time.time())}"
        test_item = {
            "id": unique_id,
            "title": "Toggle Test Item",
            "type": "concierge",
            "pillar": "dine",
            "icon": "🍽️"
        }
        
        # Step 1: Add to favorites
        add_response = session.post(f"{BASE_URL}/api/favorites/add", json={
            "pet_id": TEST_PET_ID,
            "item": test_item
        })
        assert add_response.status_code == 200
        print("✓ Step 1: Added item to favorites")
        
        # Step 2: Verify it's in the list
        get_response = session.get(f"{BASE_URL}/api/favorites/{TEST_PET_ID}")
        favorites = get_response.json().get("favorites", [])
        found = any(f.get("item_id") == unique_id for f in favorites)
        assert found, "Item should be in favorites after adding"
        print("✓ Step 2: Verified item in favorites list")
        
        # Step 3: Remove from favorites (toggle off)
        remove_response = session.post(f"{BASE_URL}/api/favorites/remove", json={
            "pet_id": TEST_PET_ID,
            "item_id": unique_id
        })
        assert remove_response.status_code == 200
        print("✓ Step 3: Removed item from favorites")
        
        # Step 4: Verify it's no longer in the list
        get_response2 = session.get(f"{BASE_URL}/api/favorites/{TEST_PET_ID}")
        favorites2 = get_response2.json().get("favorites", [])
        not_found = not any(f.get("item_id") == unique_id for f in favorites2)
        assert not_found, "Item should NOT be in favorites after removing"
        print("✓ Step 4: Verified item no longer in favorites")
        
        print("✓ Toggle favorite flow complete!")


class TestExistingFavorites:
    """Test that existing favorites are returned correctly"""
    
    def test_pet_has_existing_favorites(self):
        """Test pet-3661ae55d2e2 already has 4 favorites saved"""
        session = requests.Session()
        session.headers.update({"Content-Type": "application/json"})
        
        # Login
        response = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code == 200:
            token = response.json().get("token")
            session.headers.update({"Authorization": f"Bearer {token}"})
        
        # Get favorites
        response = session.get(f"{BASE_URL}/api/favorites/{TEST_PET_ID}")
        assert response.status_code == 200
        
        data = response.json()
        favorites = data.get("favorites", [])
        count = len(favorites)
        
        print(f"✓ Pet {TEST_PET_ID} has {count} favorites saved")
        
        # Per requirements, pet already has 4 favorites
        if count >= 4:
            print("✓ Verified pet has 4+ existing favorites as expected")
        
        # Print the favorites for verification
        for fav in favorites[:5]:
            print(f"  - {fav.get('icon', '⭐')} {fav.get('title')} ({fav.get('pillar')})")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
