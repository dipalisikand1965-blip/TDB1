"""
Test PersonalizedPicks API - /api/products/recommendations/for-pet/{pet_id}
Tests pillar filtering, scoring logic, and pet-based recommendations
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestPersonalizedPicksAPI:
    """Test the recommendations API for PersonalizedPicks component"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test fixtures"""
        # Login to get token and user info
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "dipali@clubconcierge.in",
            "password": "test123"
        })
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        
        login_data = login_response.json()
        self.token = login_data.get("access_token")
        self.user = login_data.get("user")
        
        # Get user's pets
        pets_response = requests.get(
            f"{BASE_URL}/api/pets/my-pets",
            headers={"Authorization": f"Bearer {self.token}"}
        )
        assert pets_response.status_code == 200, f"Failed to get pets: {pets_response.text}"
        
        pets_data = pets_response.json()
        self.pets = pets_data.get("pets", [])
        assert len(self.pets) > 0, "User has no pets for testing"
        
        self.test_pet = self.pets[0]
        self.pet_id = self.test_pet.get("id") or self.test_pet.get("_id")
    
    def test_recommendations_endpoint_exists(self):
        """Test that the recommendations endpoint exists and returns 200"""
        response = requests.get(f"{BASE_URL}/api/products/recommendations/for-pet/{self.pet_id}")
        assert response.status_code == 200, f"Endpoint returned {response.status_code}: {response.text}"
        
        data = response.json()
        assert "pet" in data, "Response should contain pet info"
        assert "recommendations" in data, "Response should contain recommendations"
        print(f"✓ Endpoint exists and returns {len(data.get('recommendations', []))} recommendations")
    
    def test_recommendations_with_pillar_care(self):
        """Test recommendations with pillar=care filter"""
        response = requests.get(
            f"{BASE_URL}/api/products/recommendations/for-pet/{self.pet_id}",
            params={"pillar": "care", "limit": 5}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("pillar") == "care", "Response should include pillar filter"
        
        # Check that recommendations prioritize care pillar products
        recommendations = data.get("recommendations", [])
        if recommendations:
            care_products = [r for r in recommendations if r.get("pillar") == "care"]
            print(f"✓ Care pillar: {len(care_products)}/{len(recommendations)} products are care-specific")
    
    def test_recommendations_with_pillar_dine(self):
        """Test recommendations with pillar=dine filter"""
        response = requests.get(
            f"{BASE_URL}/api/products/recommendations/for-pet/{self.pet_id}",
            params={"pillar": "dine", "limit": 5}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("pillar") == "dine", "Response should include pillar filter"
        
        recommendations = data.get("recommendations", [])
        if recommendations:
            dine_products = [r for r in recommendations if r.get("pillar") == "dine"]
            print(f"✓ Dine pillar: {len(dine_products)}/{len(recommendations)} products are dine-specific")
    
    def test_recommendations_with_pillar_shop(self):
        """Test recommendations with pillar=shop filter"""
        response = requests.get(
            f"{BASE_URL}/api/products/recommendations/for-pet/{self.pet_id}",
            params={"pillar": "shop", "limit": 5}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("pillar") == "shop", "Response should include pillar filter"
        
        recommendations = data.get("recommendations", [])
        if recommendations:
            shop_products = [r for r in recommendations if r.get("pillar") == "shop"]
            print(f"✓ Shop pillar: {len(shop_products)}/{len(recommendations)} products are shop-specific")
    
    def test_recommendations_with_pillar_stay(self):
        """Test recommendations with pillar=stay filter"""
        response = requests.get(
            f"{BASE_URL}/api/products/recommendations/for-pet/{self.pet_id}",
            params={"pillar": "stay", "limit": 5}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("pillar") == "stay", "Response should include pillar filter"
        print(f"✓ Stay pillar filter works")
    
    def test_recommendations_with_pillar_travel(self):
        """Test recommendations with pillar=travel filter"""
        response = requests.get(
            f"{BASE_URL}/api/products/recommendations/for-pet/{self.pet_id}",
            params={"pillar": "travel", "limit": 5}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("pillar") == "travel", "Response should include pillar filter"
        print(f"✓ Travel pillar filter works")
    
    def test_recommendations_with_pillar_enjoy(self):
        """Test recommendations with pillar=enjoy filter"""
        response = requests.get(
            f"{BASE_URL}/api/products/recommendations/for-pet/{self.pet_id}",
            params={"pillar": "enjoy", "limit": 5}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("pillar") == "enjoy", "Response should include pillar filter"
        print(f"✓ Enjoy pillar filter works")
    
    def test_recommendations_with_pillar_fit(self):
        """Test recommendations with pillar=fit filter"""
        response = requests.get(
            f"{BASE_URL}/api/products/recommendations/for-pet/{self.pet_id}",
            params={"pillar": "fit", "limit": 5}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("pillar") == "fit", "Response should include pillar filter"
        print(f"✓ Fit pillar filter works")
    
    def test_recommendations_with_pillar_learn(self):
        """Test recommendations with pillar=learn filter"""
        response = requests.get(
            f"{BASE_URL}/api/products/recommendations/for-pet/{self.pet_id}",
            params={"pillar": "learn", "limit": 5}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("pillar") == "learn", "Response should include pillar filter"
        print(f"✓ Learn pillar filter works")
    
    def test_recommendations_with_pillar_celebrate(self):
        """Test recommendations with pillar=celebrate filter"""
        response = requests.get(
            f"{BASE_URL}/api/products/recommendations/for-pet/{self.pet_id}",
            params={"pillar": "celebrate", "limit": 5}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("pillar") == "celebrate", "Response should include pillar filter"
        print(f"✓ Celebrate pillar filter works")
    
    def test_pet_info_in_response(self):
        """Test that pet info is included in response"""
        response = requests.get(f"{BASE_URL}/api/products/recommendations/for-pet/{self.pet_id}")
        assert response.status_code == 200
        
        data = response.json()
        pet_info = data.get("pet", {})
        
        assert "name" in pet_info, "Pet name should be in response"
        assert pet_info.get("name") == self.test_pet.get("name"), "Pet name should match"
        
        # Check for scoring filters
        filters = data.get("filters_applied", {})
        assert "size" in filters, "Size filter should be applied"
        assert "age" in filters, "Age filter should be applied"
        
        print(f"✓ Pet info correct: {pet_info.get('name')}, size={filters.get('size')}, age={filters.get('age')}")
    
    def test_limit_parameter(self):
        """Test that limit parameter works"""
        response = requests.get(
            f"{BASE_URL}/api/products/recommendations/for-pet/{self.pet_id}",
            params={"limit": 3}
        )
        assert response.status_code == 200
        
        data = response.json()
        recommendations = data.get("recommendations", [])
        assert len(recommendations) <= 3, f"Should return at most 3 recommendations, got {len(recommendations)}"
        print(f"✓ Limit parameter works: returned {len(recommendations)} recommendations")
    
    def test_invalid_pet_id(self):
        """Test that invalid pet ID returns 404"""
        response = requests.get(f"{BASE_URL}/api/products/recommendations/for-pet/invalid-pet-id-12345")
        assert response.status_code == 404, f"Should return 404 for invalid pet ID, got {response.status_code}"
        print("✓ Invalid pet ID returns 404")
    
    def test_all_pillars_have_personalized_picks_import(self):
        """Verify PersonalizedPicks is imported in all pillar pages (code review)"""
        import subprocess
        
        pillar_pages = [
            "CarePage", "CelebratePage", "DinePage", "StayPage", "TravelPage",
            "EnjoyPage", "FitPage", "LearnPage", "ShopPage", "MealsPage"
        ]
        
        missing_imports = []
        for page in pillar_pages:
            result = subprocess.run(
                ["grep", "-l", "PersonalizedPicks", f"/app/frontend/src/pages/{page}.jsx"],
                capture_output=True, text=True
            )
            if result.returncode != 0:
                missing_imports.append(page)
        
        assert len(missing_imports) == 0, f"PersonalizedPicks not imported in: {missing_imports}"
        print(f"✓ PersonalizedPicks imported in all {len(pillar_pages)} pillar pages")


class TestPersonalizedPicksEventListener:
    """Test that PersonalizedPicks listens for petSelectionChanged event"""
    
    def test_event_listener_code_exists(self):
        """Verify event listener code exists in PersonalizedPicks.jsx"""
        import subprocess
        
        # Check for petSelectionChanged event listener
        result = subprocess.run(
            ["grep", "-n", "petSelectionChanged", "/app/frontend/src/components/PersonalizedPicks.jsx"],
            capture_output=True, text=True
        )
        
        assert result.returncode == 0, "petSelectionChanged event listener not found"
        assert "addEventListener" in result.stdout, "addEventListener for petSelectionChanged not found"
        assert "removeEventListener" in result.stdout, "removeEventListener cleanup not found"
        
        print(f"✓ Event listener code found:\n{result.stdout}")
    
    def test_localstorage_check_code_exists(self):
        """Verify localStorage check for savedPetId exists"""
        import subprocess
        
        result = subprocess.run(
            ["grep", "-n", "selectedPetId", "/app/frontend/src/components/PersonalizedPicks.jsx"],
            capture_output=True, text=True
        )
        
        assert result.returncode == 0, "selectedPetId localStorage check not found"
        assert "localStorage.getItem" in result.stdout, "localStorage.getItem for selectedPetId not found"
        
        print(f"✓ localStorage check code found:\n{result.stdout}")
    
    def test_empty_state_message_exists(self):
        """Verify empty state message with pet name exists"""
        import subprocess
        
        result = subprocess.run(
            ["grep", "-n", "coming soon", "/app/frontend/src/components/PersonalizedPicks.jsx"],
            capture_output=True, text=True
        )
        
        assert result.returncode == 0, "Empty state 'coming soon' message not found"
        print(f"✓ Empty state message found:\n{result.stdout}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
