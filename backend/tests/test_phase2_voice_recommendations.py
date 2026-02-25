"""
Phase 2 Features Testing: Voice Quick Actions and Smart Recommendations
Tests for AI-powered voice commands and personalized recommendations
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test data
TEST_PET_ID = "pet-99a708f1722a"  # Mojo
TEST_USER_ID = "b5466487-966b-4f81-9931-a76b6c48680a"  # Mojo's owner


class TestSmartRecommendationsAPI:
    """Smart Recommendations API Tests - /api/recommendations/*"""
    
    def test_get_pet_recommendations_success(self):
        """Test GET /api/recommendations/pet/{pet_id} returns personalized recommendations"""
        response = requests.get(f"{BASE_URL}/api/recommendations/pet/{TEST_PET_ID}")
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "pet_id" in data
        assert data["pet_id"] == TEST_PET_ID
        assert "pet_name" in data
        assert data["pet_name"] == "Mojo"
        assert "context" in data
        assert "recommendations" in data
        assert "generated_at" in data
        
        # Verify context contains breed/age info
        context = data["context"]
        assert "breed" in context
        assert "age_category" in context
        assert "breed_needs" in context
        assert "age_needs" in context
        
        # Verify recommendations structure
        recommendations = data["recommendations"]
        assert isinstance(recommendations, list)
        if len(recommendations) > 0:
            rec = recommendations[0]
            assert "type" in rec
            assert "category" in rec
            assert "title" in rec
            assert "description" in rec
            assert "priority" in rec
            assert "cta" in rec
            assert "link" in rec
    
    def test_get_pet_recommendations_with_limit(self):
        """Test GET /api/recommendations/pet/{pet_id}?limit=2 respects limit"""
        response = requests.get(f"{BASE_URL}/api/recommendations/pet/{TEST_PET_ID}?limit=2")
        
        assert response.status_code == 200
        data = response.json()
        
        assert len(data["recommendations"]) <= 2
    
    def test_get_pet_recommendations_not_found(self):
        """Test GET /api/recommendations/pet/{invalid_id} returns 404"""
        response = requests.get(f"{BASE_URL}/api/recommendations/pet/invalid-pet-id-12345")
        
        assert response.status_code == 404
    
    def test_get_dashboard_recommendations_with_user(self):
        """Test GET /api/recommendations/dashboard?user_id={user_id} returns aggregated recommendations"""
        response = requests.get(f"{BASE_URL}/api/recommendations/dashboard?user_id={TEST_USER_ID}")
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "recommendations" in data
        assert "generated_at" in data
        
        # If user has pets, should have pets_analyzed
        if "pets_analyzed" in data:
            assert data["pets_analyzed"] >= 1
            
            # Recommendations should include pet info
            if len(data["recommendations"]) > 0:
                rec = data["recommendations"][0]
                assert "pet_name" in rec or "type" in rec
    
    def test_get_dashboard_recommendations_no_user(self):
        """Test GET /api/recommendations/dashboard without user_id returns generic recommendations"""
        response = requests.get(f"{BASE_URL}/api/recommendations/dashboard")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "recommendations" in data
        assert len(data["recommendations"]) >= 1
        
        # Should suggest adding pet profile
        rec = data["recommendations"][0]
        assert "Add" in rec.get("title", "") or "Complete" in rec.get("title", "")


class TestVoiceQuickActionsAPI:
    """Voice Quick Actions API Tests - /api/voice-actions/*"""
    
    def test_get_voice_suggestions_basic(self):
        """Test GET /api/voice-actions/suggestions returns command suggestions"""
        response = requests.get(f"{BASE_URL}/api/voice-actions/suggestions")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "suggestions" in data
        suggestions = data["suggestions"]
        assert isinstance(suggestions, list)
        assert len(suggestions) >= 5
        
        # Verify suggestion structure
        suggestion = suggestions[0]
        assert "phrase" in suggestion
        assert "icon" in suggestion
        assert "category" in suggestion
    
    def test_get_voice_suggestions_with_pet(self):
        """Test GET /api/voice-actions/suggestions?pet_id={pet_id} returns pet-specific suggestions"""
        response = requests.get(f"{BASE_URL}/api/voice-actions/suggestions?pet_id={TEST_PET_ID}")
        
        assert response.status_code == 200
        data = response.json()
        
        suggestions = data["suggestions"]
        assert len(suggestions) >= 5
        
        # First suggestions should include pet name "Mojo"
        pet_specific = [s for s in suggestions if "Mojo" in s.get("phrase", "")]
        assert len(pet_specific) >= 1, "Should have pet-specific suggestions with Mojo's name"
    
    def test_process_voice_command_grooming(self):
        """Test POST /api/voice-actions/process with grooming command"""
        response = requests.post(
            f"{BASE_URL}/api/voice-actions/process",
            params={"text": "Book grooming for tomorrow"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify intent detection
        assert data["action"] == "book_grooming"
        assert data["service_type"] == "grooming"
        assert data["pillar"] == "care"
        assert data["confidence"] >= 0.8
        
        # Verify date extraction
        assert data["extracted_data"]["date"] is not None
        
        # Verify response text
        assert "grooming" in data["response_text"].lower()
        
        # Verify suggested actions
        assert len(data["suggested_actions"]) >= 1
        assert any("Book" in a.get("label", "") for a in data["suggested_actions"])
    
    def test_process_voice_command_vet(self):
        """Test POST /api/voice-actions/process with vet appointment command"""
        response = requests.post(
            f"{BASE_URL}/api/voice-actions/process",
            params={"text": "Schedule a vet visit for next week"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["action"] == "book_vet"
        assert data["service_type"] == "vet_coordination"
        assert data["pillar"] == "care"
    
    def test_process_voice_command_food_order(self):
        """Test POST /api/voice-actions/process with food order command"""
        response = requests.post(
            f"{BASE_URL}/api/voice-actions/process",
            params={"text": "Order more dog food"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["action"] == "order_food"
        assert data["service_type"] == "order"
        assert data["pillar"] == "dine"
    
    def test_process_voice_command_with_pet_name(self):
        """Test POST /api/voice-actions/process extracts pet name from command"""
        response = requests.post(
            f"{BASE_URL}/api/voice-actions/process",
            params={
                "text": "Book grooming for Mojo tomorrow",
                "user_id": TEST_USER_ID,
                "pet_id": TEST_PET_ID
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Should extract pet name
        assert data["extracted_data"]["pet_name"] == "Mojo"
        assert data["extracted_data"]["pet_id"] == TEST_PET_ID
        
        # Response should include pet name
        assert "Mojo" in data["response_text"]
    
    def test_process_voice_command_celebration(self):
        """Test POST /api/voice-actions/process with celebration command"""
        response = requests.post(
            f"{BASE_URL}/api/voice-actions/process",
            params={"text": "Plan a birthday party for my dog"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["action"] == "plan_celebration"
        assert data["pillar"] == "celebrate"
    
    def test_process_voice_command_training(self):
        """Test POST /api/voice-actions/process with training command"""
        response = requests.post(
            f"{BASE_URL}/api/voice-actions/process",
            params={"text": "Book a training session"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["action"] == "book_training"
        assert data["service_type"] == "training"
    
    def test_process_voice_command_emergency(self):
        """Test POST /api/voice-actions/process with emergency command"""
        response = requests.post(
            f"{BASE_URL}/api/voice-actions/process",
            params={"text": "Emergency! My pet is injured"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["action"] == "emergency"
        assert data.get("is_urgent") == True
        
        # Should have emergency actions
        assert any("Emergency" in a.get("label", "") for a in data["suggested_actions"])
    
    def test_process_voice_command_date_extraction_today(self):
        """Test date extraction for 'today'"""
        response = requests.post(
            f"{BASE_URL}/api/voice-actions/process",
            params={"text": "Book grooming for today"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["extracted_data"]["date"] is not None
    
    def test_process_voice_command_date_extraction_weekend(self):
        """Test date extraction for 'this weekend'"""
        response = requests.post(
            f"{BASE_URL}/api/voice-actions/process",
            params={"text": "Find a dog walker for this weekend"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["action"] == "book_walk"
        assert data["extracted_data"]["date"] is not None
    
    def test_process_voice_command_general_query(self):
        """Test general query that doesn't match specific intents"""
        response = requests.post(
            f"{BASE_URL}/api/voice-actions/process",
            params={"text": "What time do you open?"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["action"] == "general_query"
        assert data["confidence"] < 0.85


class TestRecommendationsQuickActions:
    """Test quick action suggestions from recommendations endpoint"""
    
    def test_quick_action_suggestions(self):
        """Test GET /api/recommendations/quick-actions returns voice suggestions"""
        response = requests.get(f"{BASE_URL}/api/recommendations/quick-actions")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "suggestions" in data
        suggestions = data["suggestions"]
        assert len(suggestions) >= 5
        
        # Verify suggestion structure
        for suggestion in suggestions:
            assert "phrase" in suggestion
            assert "icon" in suggestion
            assert "action" in suggestion


class TestIntegrationFlow:
    """Integration tests for voice-to-action flow"""
    
    def test_voice_to_recommendation_flow(self):
        """Test complete flow: voice command -> action -> relevant recommendations"""
        # Step 1: Process voice command
        voice_response = requests.post(
            f"{BASE_URL}/api/voice-actions/process",
            params={
                "text": "I need grooming for Mojo",
                "user_id": TEST_USER_ID,
                "pet_id": TEST_PET_ID
            }
        )
        
        assert voice_response.status_code == 200
        voice_data = voice_response.json()
        
        # Step 2: Get pet recommendations
        rec_response = requests.get(f"{BASE_URL}/api/recommendations/pet/{TEST_PET_ID}")
        
        assert rec_response.status_code == 200
        rec_data = rec_response.json()
        
        # Both should reference the same pet
        assert voice_data["extracted_data"]["pet_id"] == rec_data["pet_id"]


@pytest.fixture
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
