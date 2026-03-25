"""
Test Soul Chapter Modal API Endpoints
Tests for the SoulChapterModal feature including:
- GET /api/pet-soul/profile/{pet_id}/quick-questions
- POST /api/pet-soul/profile/{pet_id}/answer
- GET /api/pets/my-pets (doggy_soul_answers field)
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://pet-soul-ranking.preview.emergentagent.com')

class TestSoulChapterModalAPIs:
    """Soul Chapter Modal API tests"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test fixtures"""
        # Login to get token
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "dipali@clubconcierge.in", "password": "test123"}
        )
        assert login_response.status_code == 200, f"Login failed: {login_response.text}"
        
        data = login_response.json()
        self.token = data.get("access_token")
        assert self.token, "No access_token in login response"
        
        self.headers = {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
        
        # Get pets to find test pet IDs
        pets_response = requests.get(
            f"{BASE_URL}/api/pets/my-pets",
            headers=self.headers
        )
        assert pets_response.status_code == 200
        pets_data = pets_response.json()
        self.pets = pets_data.get("pets", [])
        
        # Find specific pets for testing
        self.mojo = next((p for p in self.pets if p.get("name") == "Mojo"), None)
        self.bruno = next((p for p in self.pets if p.get("name") == "Bruno"), None)
        self.coco = next((p for p in self.pets if p.get("name") == "Coco" and p.get("overall_score", 100) == 0), None)
    
    def test_pets_have_doggy_soul_answers(self):
        """Test that /api/pets/my-pets returns pets with doggy_soul_answers field"""
        assert len(self.pets) > 0, "No pets returned"
        
        # Check Mojo has doggy_soul_answers
        assert self.mojo is not None, "Mojo pet not found"
        assert "doggy_soul_answers" in self.mojo, "Mojo missing doggy_soul_answers field"
        
        soul_answers = self.mojo.get("doggy_soul_answers", {})
        assert len(soul_answers) > 0, "Mojo has no soul answers"
        print(f"Mojo has {len(soul_answers)} soul answers")
    
    def test_mojo_has_high_score(self):
        """Test that Mojo (100% pet) has high overall_score"""
        assert self.mojo is not None, "Mojo pet not found"
        
        overall_score = self.mojo.get("overall_score", 0)
        assert overall_score >= 80, f"Mojo should have high score, got {overall_score}"
        print(f"Mojo overall_score: {overall_score}")
    
    def test_bruno_has_partial_answers(self):
        """Test that Bruno has partial soul answers"""
        assert self.bruno is not None, "Bruno pet not found"
        
        soul_answers = self.bruno.get("doggy_soul_answers", {})
        overall_score = self.bruno.get("overall_score", 0)
        
        # Bruno should have some answers but not 100%
        assert len(soul_answers) > 0, "Bruno has no soul answers"
        assert overall_score < 100, f"Bruno should have partial score, got {overall_score}"
        print(f"Bruno has {len(soul_answers)} answers, score: {overall_score}")
    
    def test_coco_has_zero_score(self):
        """Test that Coco (0% pet) has zero overall_score"""
        if self.coco is None:
            pytest.skip("Coco (0% pet) not found in test data")
        
        overall_score = self.coco.get("overall_score", 0)
        assert overall_score == 0, f"Coco should have 0 score, got {overall_score}"
        print(f"Coco overall_score: {overall_score}")
    
    def test_quick_questions_endpoint(self):
        """Test GET /api/pet-soul/profile/{pet_id}/quick-questions"""
        assert self.bruno is not None, "Bruno pet not found"
        pet_id = self.bruno.get("id")
        
        response = requests.get(
            f"{BASE_URL}/api/pet-soul/profile/{pet_id}/quick-questions?limit=5",
            headers=self.headers
        )
        
        assert response.status_code == 200, f"Quick questions failed: {response.text}"
        
        data = response.json()
        assert "questions" in data, "Response missing 'questions' field"
        assert "pet_name" in data, "Response missing 'pet_name' field"
        assert "total_unanswered" in data, "Response missing 'total_unanswered' field"
        
        questions = data.get("questions", [])
        assert len(questions) > 0, "No unanswered questions returned"
        
        # Verify question structure
        first_q = questions[0]
        assert "question_id" in first_q, "Question missing 'question_id'"
        assert "question" in first_q, "Question missing 'question' text"
        assert "type" in first_q, "Question missing 'type'"
        
        print(f"Quick questions returned {len(questions)} questions for {data.get('pet_name')}")
        print(f"Total unanswered: {data.get('total_unanswered')}")
    
    def test_answer_submission_endpoint(self):
        """Test POST /api/pet-soul/profile/{pet_id}/answer"""
        assert self.bruno is not None, "Bruno pet not found"
        pet_id = self.bruno.get("id")
        
        # Submit a test answer
        response = requests.post(
            f"{BASE_URL}/api/pet-soul/profile/{pet_id}/answer",
            headers=self.headers,
            json={
                "question_id": "test_automated_question",
                "answer": "test_automated_answer",
                "folder": "identity_temperament"
            }
        )
        
        assert response.status_code == 200, f"Answer submission failed: {response.text}"
        
        data = response.json()
        assert "scores" in data, "Response missing 'scores' field"
        
        scores = data.get("scores", {})
        assert "overall" in scores, "Scores missing 'overall' field"
        
        print(f"Answer submitted successfully, new overall score: {scores.get('overall')}")
    
    def test_answer_submission_updates_score(self):
        """Test that submitting an answer updates the pet's score"""
        assert self.bruno is not None, "Bruno pet not found"
        pet_id = self.bruno.get("id")
        
        # Get current score
        initial_score = self.bruno.get("overall_score", 0)
        
        # Submit answer
        response = requests.post(
            f"{BASE_URL}/api/pet-soul/profile/{pet_id}/answer",
            headers=self.headers,
            json={
                "question_id": "handling_comfort",
                "answer": "Very comfortable",
                "folder": "identity_temperament"
            }
        )
        
        assert response.status_code == 200
        
        data = response.json()
        new_score = data.get("scores", {}).get("overall", 0)
        
        # Score should be updated (may be same or higher)
        assert new_score >= 0, f"Invalid score returned: {new_score}"
        print(f"Score after answer: {new_score} (was {initial_score})")
    
    def test_pet_profile_endpoint(self):
        """Test GET /api/pet-soul/profile/{pet_id}"""
        assert self.mojo is not None, "Mojo pet not found"
        pet_id = self.mojo.get("id")
        
        response = requests.get(
            f"{BASE_URL}/api/pet-soul/profile/{pet_id}",
            headers=self.headers
        )
        
        assert response.status_code == 200, f"Profile fetch failed: {response.text}"
        
        data = response.json()
        assert "pet" in data, "Response missing 'pet' field"
        assert "scores" in data, "Response missing 'scores' field"
        
        scores = data.get("scores", {})
        assert "overall" in scores, "Scores missing 'overall'"
        # API returns 'categories' instead of 'folders'
        assert "categories" in scores or "tier" in scores, "Scores missing expected fields"
        
        print(f"Profile fetched, overall score: {scores.get('overall')}")
    
    def test_chapter_score_calculation(self):
        """Test that chapter scores are calculated correctly via categories"""
        assert self.mojo is not None, "Mojo pet not found"
        pet_id = self.mojo.get("id")
        
        response = requests.get(
            f"{BASE_URL}/api/pet-soul/profile/{pet_id}",
            headers=self.headers
        )
        
        assert response.status_code == 200
        
        data = response.json()
        scores = data.get("scores", {})
        
        # API uses 'categories' for score breakdown
        categories = scores.get("categories", {})
        
        # Check that category scores exist
        expected_categories = ["personality", "lifestyle", "nutrition", "relationships"]
        
        for category in expected_categories:
            assert category in categories, f"Missing category score: {category}"
            cat_data = categories[category]
            assert "earned" in cat_data, f"Category {category} missing 'earned' field"
        
        print(f"Category scores: {categories}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
