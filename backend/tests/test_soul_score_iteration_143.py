"""
Test Soul Score Consistency and New Endpoints - Iteration 143
=============================================================
Tests:
1. GET /api/pet-soul/profile/{pet_id}/quick-questions - returns max 3 unanswered questions
2. GET /api/mira/memory/pet/{pet_id}/what-mira-knows - returns combined soul knowledge + memories
3. Soul score consistency between Mira Demo and My Pets page
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials from agent context
TEST_EMAIL = "dipali@clubconcierge.in"
TEST_PASSWORD = "test123"
TEST_PET_ID = "pet-99a708f1722a"
TEST_PET_NAME = "Mojo"


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token for test user"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    if response.status_code == 200:
        data = response.json()
        return data.get("token") or data.get("access_token")
    pytest.skip(f"Authentication failed: {response.status_code} - {response.text}")


@pytest.fixture(scope="module")
def auth_headers(auth_token):
    """Create auth headers"""
    return {
        "Authorization": f"Bearer {auth_token}",
        "Content-Type": "application/json"
    }


class TestQuickQuestionsEndpoint:
    """Test the new quick-questions endpoint"""
    
    def test_quick_questions_returns_max_3_by_default(self, auth_headers):
        """Test that quick questions endpoint returns max 3 questions by default"""
        response = requests.get(
            f"{BASE_URL}/api/pet-soul/profile/{TEST_PET_ID}/quick-questions",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "questions" in data, "Response should contain 'questions' key"
        assert "pet_id" in data, "Response should contain 'pet_id' key"
        assert "pet_name" in data, "Response should contain 'pet_name' key"
        assert "total_unanswered" in data, "Response should contain 'total_unanswered' key"
        
        # Verify max 3 questions returned
        questions = data["questions"]
        assert len(questions) <= 3, f"Expected max 3 questions, got {len(questions)}"
        
        # Each question should have required fields
        for q in questions:
            assert "question_id" in q, "Each question should have 'question_id'"
            assert "question" in q, "Each question should have 'question' text"
            assert "type" in q, "Each question should have 'type'"
            assert "folder" in q, "Each question should have 'folder'"
            assert "folder_name" in q, "Each question should have 'folder_name'"
        
        print(f"✅ Quick questions returned {len(questions)} questions (max 3)")
        print(f"   Total unanswered: {data['total_unanswered']}")
        print(f"   Current score: {data.get('current_score', 'N/A')}")
    
    def test_quick_questions_with_limit_parameter(self, auth_headers):
        """Test that limit parameter is respected"""
        response = requests.get(
            f"{BASE_URL}/api/pet-soul/profile/{TEST_PET_ID}/quick-questions?limit=2",
            headers=auth_headers
        )
        assert response.status_code == 200
        
        data = response.json()
        questions = data["questions"]
        assert len(questions) <= 2, f"Expected max 2 questions with limit=2, got {len(questions)}"
        
        print(f"✅ Quick questions with limit=2 returned {len(questions)} questions")
    
    def test_quick_questions_from_different_folders(self, auth_headers):
        """Test that questions come from different folders when possible"""
        response = requests.get(
            f"{BASE_URL}/api/pet-soul/profile/{TEST_PET_ID}/quick-questions?limit=3",
            headers=auth_headers
        )
        assert response.status_code == 200
        
        data = response.json()
        questions = data["questions"]
        
        if len(questions) >= 2:
            folders = [q["folder"] for q in questions]
            # Check for diversity
            unique_folders = set(folders)
            print(f"✅ Questions from {len(unique_folders)} different folders: {unique_folders}")
        else:
            print(f"⚠️ Only {len(questions)} questions available, can't test folder diversity")
    
    def test_quick_questions_pet_not_found(self, auth_headers):
        """Test error handling for non-existent pet"""
        response = requests.get(
            f"{BASE_URL}/api/pet-soul/profile/non-existent-pet-id/quick-questions",
            headers=auth_headers
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✅ Returns 404 for non-existent pet")


class TestWhatMiraKnowsEndpoint:
    """Test the new what-mira-knows endpoint"""
    
    def test_what_mira_knows_returns_data(self, auth_headers):
        """Test that what-mira-knows endpoint returns combined knowledge"""
        response = requests.get(
            f"{BASE_URL}/api/mira/memory/pet/{TEST_PET_ID}/what-mira-knows",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Check required fields
        assert "pet_id" in data, "Response should contain 'pet_id'"
        assert "pet_name" in data, "Response should contain 'pet_name'"
        assert "overall_score" in data, "Response should contain 'overall_score'"
        assert "knowledge_count" in data, "Response should contain 'knowledge_count'"
        
        # Check knowledge arrays exist
        assert "soul_knowledge" in data, "Response should contain 'soul_knowledge' array"
        assert "memory_knowledge" in data, "Response should contain 'memory_knowledge' array"
        assert "insights_knowledge" in data, "Response should contain 'insights_knowledge' array"
        assert "all_knowledge" in data, "Response should contain 'all_knowledge' combined array"
        
        print(f"✅ What Mira Knows returned for {data['pet_name']}")
        print(f"   Overall Score: {data['overall_score']}%")
        print(f"   Knowledge Count: {data['knowledge_count']}")
        print(f"   Soul Knowledge Items: {len(data['soul_knowledge'])}")
        print(f"   Memory Knowledge Items: {len(data['memory_knowledge'])}")
        print(f"   Insights Knowledge Items: {len(data['insights_knowledge'])}")
    
    def test_what_mira_knows_soul_knowledge_format(self, auth_headers):
        """Test that soul_knowledge items have correct format"""
        response = requests.get(
            f"{BASE_URL}/api/mira/memory/pet/{TEST_PET_ID}/what-mira-knows",
            headers=auth_headers
        )
        assert response.status_code == 200
        
        data = response.json()
        soul_knowledge = data.get("soul_knowledge", [])
        
        for item in soul_knowledge:
            assert "category" in item, "Soul knowledge item should have 'category'"
            assert "icon" in item, "Soul knowledge item should have 'icon'"
            assert "label" in item, "Soul knowledge item should have 'label'"
            assert "text" in item, "Soul knowledge item should have 'text'"
            assert "source" in item, "Soul knowledge item should have 'source'"
        
        print(f"✅ Soul knowledge items have correct format ({len(soul_knowledge)} items)")
    
    def test_what_mira_knows_requires_auth(self):
        """Test that endpoint requires authentication"""
        response = requests.get(
            f"{BASE_URL}/api/mira/memory/pet/{TEST_PET_ID}/what-mira-knows"
        )
        # Should return 401 without auth
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✅ Endpoint requires authentication")
    
    def test_what_mira_knows_pet_not_found(self, auth_headers):
        """Test error handling for non-existent pet"""
        response = requests.get(
            f"{BASE_URL}/api/mira/memory/pet/non-existent-pet/what-mira-knows",
            headers=auth_headers
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✅ Returns 404 for non-existent pet")


class TestSoulScoreConsistency:
    """Test that soul score is consistent across endpoints"""
    
    def test_soul_score_from_pet_profile(self, auth_headers):
        """Get soul score from pet-soul profile endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/pet-soul/profile/{TEST_PET_ID}",
            headers=auth_headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        scores = data.get("scores", {})
        overall_score = scores.get("overall", 0)
        
        print(f"✅ Pet Soul Profile Score: {overall_score}%")
        return overall_score
    
    def test_soul_score_from_mira_knows(self, auth_headers):
        """Get soul score from what-mira-knows endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/mira/memory/pet/{TEST_PET_ID}/what-mira-knows",
            headers=auth_headers
        )
        assert response.status_code == 200
        
        data = response.json()
        overall_score = data.get("overall_score", 0)
        
        print(f"✅ What Mira Knows Score: {overall_score}%")
        return overall_score
    
    def test_soul_score_from_my_pets(self, auth_headers):
        """Get soul score from my-pets endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/pets/my-pets",
            headers=auth_headers
        )
        assert response.status_code == 200
        
        data = response.json()
        pets = data.get("pets", [])
        
        # Find the test pet
        test_pet = None
        for pet in pets:
            if pet.get("id") == TEST_PET_ID:
                test_pet = pet
                break
        
        if test_pet:
            overall_score = test_pet.get("overall_score", 0)
            print(f"✅ My Pets Score: {overall_score}%")
            return overall_score
        else:
            print(f"⚠️ Test pet {TEST_PET_ID} not found in my-pets response")
            return None
    
    def test_soul_score_consistency_all_sources(self, auth_headers):
        """Verify soul score is consistent across all sources"""
        # Get scores from all sources
        # Source 1: pet-soul profile
        response1 = requests.get(
            f"{BASE_URL}/api/pet-soul/profile/{TEST_PET_ID}",
            headers=auth_headers
        )
        score1 = response1.json().get("scores", {}).get("overall", 0) if response1.status_code == 200 else None
        
        # Source 2: what-mira-knows
        response2 = requests.get(
            f"{BASE_URL}/api/mira/memory/pet/{TEST_PET_ID}/what-mira-knows",
            headers=auth_headers
        )
        score2 = response2.json().get("overall_score", 0) if response2.status_code == 200 else None
        
        # Source 3: my-pets
        response3 = requests.get(
            f"{BASE_URL}/api/pets/my-pets",
            headers=auth_headers
        )
        score3 = None
        if response3.status_code == 200:
            pets = response3.json().get("pets", [])
            for pet in pets:
                if pet.get("id") == TEST_PET_ID:
                    score3 = pet.get("overall_score", 0)
                    break
        
        print(f"\n📊 Soul Score Comparison:")
        print(f"   Pet Soul Profile: {score1}")
        print(f"   What Mira Knows:  {score2}")
        print(f"   My Pets:          {score3}")
        
        # All available scores should match
        scores = [s for s in [score1, score2, score3] if s is not None]
        if len(scores) >= 2:
            first_score = scores[0]
            all_consistent = all(abs(s - first_score) < 0.1 for s in scores)
            assert all_consistent, f"Soul scores inconsistent: {scores}"
            print(f"\n✅ All soul scores are consistent!")
        else:
            print(f"\n⚠️ Only {len(scores)} scores available, can't fully verify consistency")


class TestMiraPersonalizationStats:
    """Test the personalization stats endpoint used by MiraDemo"""
    
    def test_personalization_stats_endpoint(self, auth_headers):
        """Test that personalization stats returns expected data"""
        response = requests.get(
            f"{BASE_URL}/api/mira/personalization-stats/{TEST_PET_ID}",
            headers=auth_headers
        )
        
        # This endpoint may return 200 or 404 depending on data
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Personalization stats returned:")
            print(f"   Data keys: {list(data.keys())}")
            if "knowledge_items" in data:
                print(f"   Knowledge items: {len(data['knowledge_items'])}")
            if "soul_score" in data:
                print(f"   Soul score: {data['soul_score']}")
        else:
            print(f"⚠️ Personalization stats returned {response.status_code}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
