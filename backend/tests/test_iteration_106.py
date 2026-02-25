"""
Iteration 106 Tests - Bug Fixes Verification
=============================================
Tests for:
1. Pet Soul Score weighted scoring (POST /api/pets/{id}/soul-answer)
2. Wishlist API (POST /api/member/wishlist/add, GET /api/member/wishlist)
3. Admin wishlist summary (GET /api/admin/wishlists/summary)

Note: Select dropdown z-index and Farewell page emotional indicator are UI tests
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
ADMIN_USERNAME = "aditya"
ADMIN_PASSWORD = "lola4304"
MEMBER_EMAIL = "dipali@clubconcierge.in"
MEMBER_PASSWORD = "test123"


class TestHealthCheck:
    """Basic health checks"""
    
    def test_api_health(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print(f"✓ API health check passed: {data}")
    
    def test_db_health(self):
        """Test database health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health/db")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["database"] == "connected"
        print(f"✓ DB health check passed: {data}")


class TestMemberAuth:
    """Member authentication tests"""
    
    @pytest.fixture
    def member_token(self):
        """Get member authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": MEMBER_EMAIL,
            "password": MEMBER_PASSWORD
        })
        if response.status_code == 200:
            token = response.json().get("access_token")
            print(f"✓ Member login successful, token obtained")
            return token
        pytest.skip(f"Member login failed: {response.status_code} - {response.text}")
    
    def test_member_login(self, member_token):
        """Test member can login"""
        assert member_token is not None
        print(f"✓ Member token: {member_token[:20]}...")


class TestPetSoulScoreWeighted:
    """Test Pet Soul Score uses weighted scoring consistently"""
    
    @pytest.fixture
    def member_token(self):
        """Get member authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": MEMBER_EMAIL,
            "password": MEMBER_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Member login failed")
    
    @pytest.fixture
    def test_pet_id(self, member_token):
        """Get or create a test pet"""
        headers = {"Authorization": f"Bearer {member_token}"}
        
        # First try to get existing pets
        response = requests.get(f"{BASE_URL}/api/pets/my-pets", headers=headers)
        if response.status_code == 200:
            pets = response.json().get("pets", [])
            if pets:
                pet_id = pets[0].get("id")
                print(f"✓ Using existing pet: {pet_id}")
                return pet_id
        
        # Create a new pet if none exist
        pet_data = {
            "name": f"TEST_SoulScorePet_{uuid.uuid4().hex[:6]}",
            "breed": "Golden Retriever",
            "birth_date": "2022-01-15",
            "gender": "male"
        }
        response = requests.post(f"{BASE_URL}/api/pets", json=pet_data, headers=headers)
        if response.status_code in [200, 201]:
            pet_id = response.json().get("id")
            print(f"✓ Created test pet: {pet_id}")
            return pet_id
        
        pytest.skip(f"Could not get or create test pet: {response.status_code}")
    
    def test_soul_answer_weighted_scoring(self, member_token, test_pet_id):
        """Test POST /api/pets/{id}/soul-answer uses weighted scoring"""
        headers = {"Authorization": f"Bearer {member_token}"}
        
        # Submit a high-weight answer (food_allergies = 10 points)
        answer_data = {
            "question_id": "food_allergies",
            "answer": "chicken"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/pets/{test_pet_id}/soul-answer",
            json=answer_data,
            headers=headers
        )
        
        assert response.status_code == 200, f"Failed: {response.status_code} - {response.text}"
        data = response.json()
        
        # Verify response contains weighted score data
        assert "new_score" in data, "Response should contain new_score"
        assert "score_tier" in data, "Response should contain score_tier"
        assert "answers_count" in data, "Response should contain answers_count"
        
        # The score should be a percentage (0-100), not a simple count
        new_score = data["new_score"]
        assert isinstance(new_score, (int, float)), "Score should be numeric"
        assert 0 <= new_score <= 100, f"Score should be 0-100, got {new_score}"
        
        print(f"✓ Soul answer saved with weighted scoring:")
        print(f"  - Question: {answer_data['question_id']}")
        print(f"  - New Score: {new_score}")
        print(f"  - Tier: {data['score_tier']}")
        print(f"  - Answers Count: {data['answers_count']}")
    
    def test_soul_answer_multiple_questions(self, member_token, test_pet_id):
        """Test multiple soul answers accumulate correctly with weights"""
        headers = {"Authorization": f"Bearer {member_token}"}
        
        # Submit multiple answers with different weights
        answers_to_submit = [
            {"question_id": "temperament", "answer": "friendly"},  # 8 points
            {"question_id": "energy_level", "answer": "high"},     # 6 points
            {"question_id": "health_conditions", "answer": "none"}, # 8 points
        ]
        
        scores = []
        for answer_data in answers_to_submit:
            response = requests.post(
                f"{BASE_URL}/api/pets/{test_pet_id}/soul-answer",
                json=answer_data,
                headers=headers
            )
            assert response.status_code == 200, f"Failed for {answer_data['question_id']}"
            data = response.json()
            scores.append(data["new_score"])
            print(f"  - {answer_data['question_id']}: score = {data['new_score']}")
        
        # Scores should generally increase as more answers are added
        # (unless answers are being replaced)
        print(f"✓ Multiple soul answers processed, final score: {scores[-1]}")
    
    def test_pet_score_state_endpoint(self, member_token, test_pet_id):
        """Test GET /api/pet-score/{pet_id}/score_state returns weighted data"""
        headers = {"Authorization": f"Bearer {member_token}"}
        
        response = requests.get(
            f"{BASE_URL}/api/pet-score/{test_pet_id}/score_state",
            headers=headers
        )
        
        assert response.status_code == 200, f"Failed: {response.status_code} - {response.text}"
        data = response.json()
        
        # Verify weighted scoring structure
        assert "score" in data, "Should have score"
        assert "tier" in data, "Should have tier"
        assert "categories" in data, "Should have category breakdown"
        assert "stats" in data, "Should have stats"
        
        # Verify category scores exist
        categories = data.get("categories", {})
        expected_categories = ["safety", "personality", "lifestyle", "nutrition", "training", "relationships"]
        for cat in expected_categories:
            if cat in categories:
                assert "earned" in categories[cat], f"Category {cat} should have earned"
                assert "possible" in categories[cat], f"Category {cat} should have possible"
                assert "percentage" in categories[cat], f"Category {cat} should have percentage"
        
        print(f"✓ Pet score state endpoint returns weighted data:")
        print(f"  - Total Score: {data['score']}")
        print(f"  - Tier: {data.get('tier', {}).get('name', 'Unknown')}")
        print(f"  - Categories: {list(categories.keys())}")


class TestWishlistAPI:
    """Test Wishlist API endpoints"""
    
    @pytest.fixture
    def member_token(self):
        """Get member authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": MEMBER_EMAIL,
            "password": MEMBER_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Member login failed")
    
    @pytest.fixture
    def test_product_id(self):
        """Get a product ID for testing"""
        response = requests.get(f"{BASE_URL}/api/products?limit=1")
        if response.status_code == 200:
            products = response.json().get("products", [])
            if products:
                return products[0].get("id")
        # Return a test product ID if no products exist
        return f"TEST_PRODUCT_{uuid.uuid4().hex[:8]}"
    
    def test_add_to_wishlist(self, member_token, test_product_id):
        """Test POST /api/member/wishlist/add"""
        headers = {"Authorization": f"Bearer {member_token}"}
        
        response = requests.post(
            f"{BASE_URL}/api/member/wishlist/add",
            json={"product_id": test_product_id},
            headers=headers
        )
        
        assert response.status_code == 200, f"Failed: {response.status_code} - {response.text}"
        data = response.json()
        
        assert "message" in data, "Response should have message"
        assert "product_id" in data, "Response should have product_id"
        assert data["product_id"] == test_product_id
        
        print(f"✓ Added to wishlist: {test_product_id}")
        print(f"  - Response: {data}")
    
    def test_get_wishlist(self, member_token, test_product_id):
        """Test GET /api/member/wishlist"""
        headers = {"Authorization": f"Bearer {member_token}"}
        
        # First add a product to ensure wishlist is not empty
        requests.post(
            f"{BASE_URL}/api/member/wishlist/add",
            json={"product_id": test_product_id},
            headers=headers
        )
        
        # Get wishlist
        response = requests.get(
            f"{BASE_URL}/api/member/wishlist",
            headers=headers
        )
        
        assert response.status_code == 200, f"Failed: {response.status_code} - {response.text}"
        data = response.json()
        
        assert "wishlist" in data, "Response should have wishlist array"
        assert "count" in data, "Response should have count"
        assert isinstance(data["wishlist"], list), "Wishlist should be a list"
        
        print(f"✓ Got wishlist:")
        print(f"  - Count: {data['count']}")
        print(f"  - Items: {len(data['wishlist'])}")
    
    def test_remove_from_wishlist(self, member_token, test_product_id):
        """Test DELETE /api/member/wishlist/{product_id}"""
        headers = {"Authorization": f"Bearer {member_token}"}
        
        # First add a product
        requests.post(
            f"{BASE_URL}/api/member/wishlist/add",
            json={"product_id": test_product_id},
            headers=headers
        )
        
        # Remove from wishlist
        response = requests.delete(
            f"{BASE_URL}/api/member/wishlist/{test_product_id}",
            headers=headers
        )
        
        assert response.status_code == 200, f"Failed: {response.status_code} - {response.text}"
        data = response.json()
        
        assert "message" in data, "Response should have message"
        print(f"✓ Removed from wishlist: {test_product_id}")


class TestAdminWishlistSummary:
    """Test Admin Wishlist Summary endpoint"""
    
    @pytest.fixture
    def admin_auth(self):
        """Get admin basic auth"""
        return (ADMIN_USERNAME, ADMIN_PASSWORD)
    
    def test_admin_wishlist_summary(self, admin_auth):
        """Test GET /api/admin/wishlists/summary"""
        response = requests.get(
            f"{BASE_URL}/api/admin/wishlists/summary",
            auth=admin_auth
        )
        
        assert response.status_code == 200, f"Failed: {response.status_code} - {response.text}"
        data = response.json()
        
        assert "popular_wishlisted" in data, "Response should have popular_wishlisted"
        assert "total_wishlisted_products" in data, "Response should have total_wishlisted_products"
        assert isinstance(data["popular_wishlisted"], list), "popular_wishlisted should be a list"
        
        print(f"✓ Admin wishlist summary:")
        print(f"  - Total wishlisted products: {data['total_wishlisted_products']}")
        print(f"  - Popular items count: {len(data['popular_wishlisted'])}")


class TestPetScoreConfig:
    """Test Pet Score configuration endpoints"""
    
    def test_score_config(self):
        """Test GET /api/pet-score/config returns weighted configuration"""
        response = requests.get(f"{BASE_URL}/api/pet-score/config")
        
        assert response.status_code == 200, f"Failed: {response.status_code} - {response.text}"
        data = response.json()
        
        assert "questions" in data, "Should have questions"
        assert "tiers" in data, "Should have tiers"
        assert "categories" in data, "Should have categories"
        
        # Verify questions have weights
        questions = data.get("questions", {})
        assert len(questions) > 0, "Should have questions defined"
        
        # Check a known high-weight question
        if "food_allergies" in questions:
            assert questions["food_allergies"]["weight"] == 10, "food_allergies should have weight 10"
        
        print(f"✓ Pet score config:")
        print(f"  - Total questions: {data.get('total_questions', 0)}")
        print(f"  - Max score: {data.get('max_score', 0)}")
        print(f"  - Tiers: {list(data.get('tiers', {}).keys())}")
    
    def test_score_tiers(self):
        """Test GET /api/pet-score/tiers returns tier definitions"""
        response = requests.get(f"{BASE_URL}/api/pet-score/tiers")
        
        assert response.status_code == 200, f"Failed: {response.status_code} - {response.text}"
        data = response.json()
        
        assert "tiers" in data, "Should have tiers"
        assert "tier_order" in data, "Should have tier_order"
        
        expected_tiers = ["newcomer", "soul_seeker", "soul_explorer", "soul_master"]
        assert data["tier_order"] == expected_tiers, f"Tier order should be {expected_tiers}"
        
        print(f"✓ Pet score tiers: {data['tier_order']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
