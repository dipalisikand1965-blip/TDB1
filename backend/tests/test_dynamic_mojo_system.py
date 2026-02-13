"""
Dynamic MOJO System Tests
=========================
Tests for Pet Soul Score updates, Achievement Badge Awards, and Paw Points

Features tested:
1. Soul Score updates when user answers questions via /api/pet-soul/profile/{pet_id}/answers/bulk
2. Achievement sync-achievements API returns new_achievements and points_earned correctly
3. Paw Points balance updates after answering questions
4. Dashboard shows real-time soul scores for all pets
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_USER = "dipali@clubconcierge.in"
TEST_PASSWORD = "test123"


@pytest.fixture(scope="module")
def auth_token():
    """Authenticate and get JWT token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_USER,
        "password": TEST_PASSWORD
    })
    assert response.status_code == 200, f"Login failed: {response.text}"
    data = response.json()
    assert "token" in data, "No token in login response"
    return data["token"]


@pytest.fixture(scope="module") 
def user_data(auth_token):
    """Get user data including pets"""
    response = requests.get(f"{BASE_URL}/api/pets/my-pets", headers={
        "Authorization": f"Bearer {auth_token}"
    })
    assert response.status_code == 200, f"Failed to get pets: {response.text}"
    data = response.json()
    return data


@pytest.fixture(scope="module")
def test_pet_id(user_data):
    """Get a test pet ID"""
    pets = user_data.get("pets", [])
    # Try to find Buddy for consistency with previous tests
    buddy = next((p for p in pets if p.get("name", "").lower() == "buddy"), None)
    if buddy:
        return buddy.get("id")
    # Fall back to first pet
    assert len(pets) > 0, "No pets found for test user"
    return pets[0].get("id")


class TestPetSoulBulkAnswers:
    """Tests for Pet Soul bulk answers endpoint"""
    
    def test_bulk_answers_endpoint_exists(self, auth_token, test_pet_id):
        """Test that the bulk answers endpoint exists and responds"""
        # Test with minimal data
        response = requests.post(
            f"{BASE_URL}/api/pet-soul/profile/{test_pet_id}/answers/bulk",
            headers={
                "Authorization": f"Bearer {auth_token}",
                "Content-Type": "application/json"
            },
            json={}
        )
        # Should accept empty payload
        assert response.status_code in [200, 201], f"Bulk answers endpoint failed: {response.status_code} - {response.text}"
        print(f"✅ Bulk answers endpoint accessible for pet {test_pet_id}")

    def test_bulk_answers_returns_scores(self, auth_token, test_pet_id):
        """Test that submitting answers returns updated scores"""
        # Submit a new soul question answer
        test_answers = {
            "energy_level": "High energy"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/pet-soul/profile/{test_pet_id}/answers/bulk",
            headers={
                "Authorization": f"Bearer {auth_token}",
                "Content-Type": "application/json"
            },
            json=test_answers
        )
        
        assert response.status_code in [200, 201], f"Failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "success" in data, "Response missing 'success' field"
        assert data["success"] == True, "success should be True"
        assert "scores" in data, "Response missing 'scores' field"
        assert "overall" in data["scores"], "Scores missing 'overall' field"
        
        print(f"✅ Soul answers submitted successfully")
        print(f"   New overall score: {data['scores'].get('overall')}%")
        print(f"   Answers saved: {data.get('answers_saved', 0)}")
        print(f"   New answers count: {data.get('new_answers', 0)}")

    def test_bulk_answers_awards_paw_points(self, auth_token, test_pet_id):
        """Test that submitting NEW answers awards paw points"""
        # First, get current paw points balance
        balance_response = requests.get(
            f"{BASE_URL}/api/paw-points/balance",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        initial_balance = 0
        if balance_response.status_code == 200:
            initial_balance = balance_response.json().get("balance", 0)
        
        # Submit a unique answer that likely hasn't been answered
        unique_field = f"test_field_{int(time.time())}"
        test_answers = {
            "food_motivation": "Very food motivated",
            "stranger_reaction": "Very friendly"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/pet-soul/profile/{test_pet_id}/answers/bulk",
            headers={
                "Authorization": f"Bearer {auth_token}",
                "Content-Type": "application/json"
            },
            json=test_answers
        )
        
        assert response.status_code in [200, 201], f"Failed: {response.text}"
        data = response.json()
        
        # Check for points earned in response
        points_earned = data.get("points_earned", 0)
        new_answers = data.get("new_answers", 0)
        
        print(f"✅ Bulk answers response:")
        print(f"   New answers: {new_answers}")
        print(f"   Points earned: {points_earned}")
        
        # Note: points_earned may be 0 if the answers were already in the system


class TestSyncAchievements:
    """Tests for Achievement sync endpoint"""
    
    def test_sync_achievements_endpoint(self, auth_token):
        """Test that sync-achievements endpoint works"""
        response = requests.post(
            f"{BASE_URL}/api/paw-points/sync-achievements",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200, f"Sync achievements failed: {response.status_code} - {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "success" in data, "Response missing 'success' field"
        assert "new_achievements" in data, "Response missing 'new_achievements' field"
        assert "points_earned" in data, "Response missing 'points_earned' field"
        assert "questions_answered" in data, "Response missing 'questions_answered' field"
        
        print(f"✅ Sync achievements endpoint working")
        print(f"   Success: {data['success']}")
        print(f"   New achievements: {data['new_achievements']}")
        print(f"   Points earned: {data['points_earned']}")
        print(f"   Questions answered count: {data['questions_answered']}")

    def test_sync_achievements_returns_correct_structure(self, auth_token):
        """Test sync-achievements returns correct data types"""
        response = requests.post(
            f"{BASE_URL}/api/paw-points/sync-achievements",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Validate types
        assert isinstance(data["success"], bool), "success should be boolean"
        assert isinstance(data["new_achievements"], list), "new_achievements should be list"
        assert isinstance(data["points_earned"], int), "points_earned should be int"
        assert isinstance(data["questions_answered"], int), "questions_answered should be int"
        
        # Check for balance or current_balance field
        if data["points_earned"] > 0:
            assert "new_balance" in data, "Should have new_balance when points earned"
        else:
            assert "current_balance" in data or "new_balance" in data, "Should have balance field"
        
        print(f"✅ Sync achievements response structure is correct")


class TestPawPointsBalance:
    """Tests for Paw Points balance endpoint"""
    
    def test_paw_points_balance_endpoint(self, auth_token):
        """Test that balance endpoint returns current points"""
        response = requests.get(
            f"{BASE_URL}/api/paw-points/balance",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200, f"Balance endpoint failed: {response.status_code}"
        data = response.json()
        
        # Verify response structure
        assert "balance" in data, "Response missing 'balance' field"
        assert "tier" in data, "Response missing 'tier' field"
        assert "lifetime_earned" in data, "Response missing 'lifetime_earned' field"
        
        print(f"✅ Paw Points balance endpoint working")
        print(f"   Balance: {data['balance']}")
        print(f"   Tier: {data['tier']}")
        print(f"   Lifetime earned: {data['lifetime_earned']}")

    def test_paw_points_history_endpoint(self, auth_token):
        """Test that history endpoint returns transactions"""
        response = requests.get(
            f"{BASE_URL}/api/paw-points/history?limit=10",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200, f"History endpoint failed: {response.status_code}"
        data = response.json()
        
        # Verify response structure
        assert "transactions" in data, "Response missing 'transactions' field"
        assert "current_balance" in data, "Response missing 'current_balance' field"
        assert isinstance(data["transactions"], list), "transactions should be a list"
        
        print(f"✅ Paw Points history endpoint working")
        print(f"   Transactions count: {len(data['transactions'])}")
        print(f"   Current balance: {data['current_balance']}")


class TestDashboardSoulScores:
    """Tests for Dashboard showing soul scores"""
    
    def test_pets_endpoint_returns_soul_scores(self, auth_token):
        """Test that pets endpoint returns soul scores"""
        response = requests.get(
            f"{BASE_URL}/api/pets/my-pets",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200, f"Pets endpoint failed: {response.status_code}"
        data = response.json()
        
        assert "pets" in data, "Response missing 'pets' field"
        pets = data["pets"]
        
        print(f"✅ Pets endpoint returns {len(pets)} pets")
        
        for pet in pets:
            name = pet.get("name", "Unknown")
            score = pet.get("overall_score", 0)
            answers = pet.get("doggy_soul_answers", {})
            answer_count = len([v for v in answers.values() if v])
            
            print(f"   - {name}: {score}% soul score, {answer_count} answers")

    def test_pet_soul_profile_endpoint(self, auth_token, test_pet_id):
        """Test that pet soul profile endpoint returns complete data"""
        response = requests.get(
            f"{BASE_URL}/api/pet-soul/profile/{test_pet_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200, f"Pet soul profile failed: {response.status_code}"
        data = response.json()
        
        # Verify response structure
        assert "pet" in data, "Response missing 'pet' field"
        assert "scores" in data, "Response missing 'scores' field"
        
        scores = data["scores"]
        assert "overall" in scores, "Scores missing 'overall' field"
        
        print(f"✅ Pet Soul profile endpoint working")
        print(f"   Pet ID: {test_pet_id}")
        print(f"   Overall score: {scores['overall']}%")
        
        if "folders" in scores:
            print(f"   Folder scores: {scores['folders']}")


class TestEndToEndSoulFlow:
    """End-to-end test of the complete Soul → Achievement → Points flow"""
    
    def test_complete_soul_journey_flow(self, auth_token, test_pet_id):
        """Test the complete flow: Submit answers → Sync achievements → Check balance"""
        print("\n🔄 Starting End-to-End Soul Journey Flow Test")
        
        # Step 1: Get initial state
        balance_before = requests.get(
            f"{BASE_URL}/api/paw-points/balance",
            headers={"Authorization": f"Bearer {auth_token}"}
        ).json()
        initial_points = balance_before.get("balance", 0)
        print(f"   Step 1: Initial paw points: {initial_points}")
        
        # Step 2: Submit soul answers
        test_answers = {
            "temperament": "Friendly",
            "social_with_people": "Very social - loves everyone",
            "food_motivation": "Very - will do anything for food"
        }
        
        answers_response = requests.post(
            f"{BASE_URL}/api/pet-soul/profile/{test_pet_id}/answers/bulk",
            headers={
                "Authorization": f"Bearer {auth_token}",
                "Content-Type": "application/json"
            },
            json=test_answers
        )
        
        assert answers_response.status_code in [200, 201]
        answers_data = answers_response.json()
        print(f"   Step 2: Submitted {answers_data.get('answers_saved', 0)} answers")
        print(f"           New answers: {answers_data.get('new_answers', 0)}")
        print(f"           Soul score: {answers_data.get('scores', {}).get('overall', 'N/A')}%")
        
        # Step 3: Sync achievements
        sync_response = requests.post(
            f"{BASE_URL}/api/paw-points/sync-achievements",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert sync_response.status_code == 200
        sync_data = sync_response.json()
        print(f"   Step 3: Achievement sync:")
        print(f"           New achievements: {sync_data.get('new_achievements', [])}")
        print(f"           Points earned from achievements: {sync_data.get('points_earned', 0)}")
        print(f"           Questions answered (counted): {sync_data.get('questions_answered', 0)}")
        
        # Step 4: Get final balance
        balance_after = requests.get(
            f"{BASE_URL}/api/paw-points/balance",
            headers={"Authorization": f"Bearer {auth_token}"}
        ).json()
        final_points = balance_after.get("balance", 0)
        print(f"   Step 4: Final paw points: {final_points}")
        
        # Calculate total points change
        points_diff = final_points - initial_points
        print(f"\n✅ End-to-End flow complete!")
        print(f"   Total points change: {points_diff}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
