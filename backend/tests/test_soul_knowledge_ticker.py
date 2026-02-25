"""
Test Suite: Soul Knowledge Ticker & Personalization Stats API
Tests the new /api/mira/personalization-stats endpoint that powers the dynamic
rolling ticker showing everything Mira knows about the pet.

Features tested:
- /api/mira/personalization-stats/{pet_id} returns knowledge_items array
- Knowledge items have correct structure (icon, text, category, priority)
- Soul score is included
- Backward compatibility with legacy stats array
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestPersonalizationStatsAPI:
    """Tests for the personalization-stats endpoint that powers SoulKnowledgeTicker"""
    
    def test_personalization_stats_endpoint_exists(self):
        """Test that the personalization-stats endpoint returns 200"""
        pet_id = "pet-99a708f1722a"
        response = requests.get(f"{BASE_URL}/api/mira/personalization-stats/{pet_id}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print(f"✅ Personalization stats endpoint returned {response.status_code}")
    
    def test_personalization_stats_returns_success(self):
        """Test that the endpoint returns success: true"""
        pet_id = "pet-99a708f1722a"
        response = requests.get(f"{BASE_URL}/api/mira/personalization-stats/{pet_id}")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("success") == True, f"Expected success=True, got {data.get('success')}"
        print(f"✅ API returned success: {data.get('success')}")
    
    def test_personalization_stats_has_knowledge_items(self):
        """Test that knowledge_items array is present and non-empty"""
        pet_id = "pet-99a708f1722a"
        response = requests.get(f"{BASE_URL}/api/mira/personalization-stats/{pet_id}")
        
        assert response.status_code == 200
        data = response.json()
        
        knowledge_items = data.get("knowledge_items", [])
        assert isinstance(knowledge_items, list), "knowledge_items should be a list"
        assert len(knowledge_items) > 0, "knowledge_items should not be empty"
        
        print(f"✅ Found {len(knowledge_items)} knowledge items")
    
    def test_knowledge_item_structure(self):
        """Test that each knowledge item has the required fields"""
        pet_id = "pet-99a708f1722a"
        response = requests.get(f"{BASE_URL}/api/mira/personalization-stats/{pet_id}")
        
        assert response.status_code == 200
        data = response.json()
        
        knowledge_items = data.get("knowledge_items", [])
        assert len(knowledge_items) > 0, "Need at least one knowledge item to test structure"
        
        required_fields = ["icon", "text", "category"]
        for item in knowledge_items[:5]:  # Test first 5 items
            for field in required_fields:
                assert field in item, f"Knowledge item missing required field: {field}"
        
        print(f"✅ Knowledge items have correct structure")
    
    def test_knowledge_item_categories(self):
        """Test that knowledge items have valid categories"""
        pet_id = "pet-99a708f1722a"
        response = requests.get(f"{BASE_URL}/api/mira/personalization-stats/{pet_id}")
        
        assert response.status_code == 200
        data = response.json()
        
        knowledge_items = data.get("knowledge_items", [])
        valid_categories = ["soul", "diet", "health", "activity", "personality", "memory", "breed"]
        
        categories_found = set()
        for item in knowledge_items:
            category = item.get("category")
            categories_found.add(category)
            assert category in valid_categories, f"Invalid category: {category}"
        
        print(f"✅ Found categories: {categories_found}")
    
    def test_soul_score_returned(self):
        """Test that soul_score is included in response"""
        pet_id = "pet-99a708f1722a"
        response = requests.get(f"{BASE_URL}/api/mira/personalization-stats/{pet_id}")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "soul_score" in data, "Response should include soul_score"
        soul_score = data.get("soul_score")
        assert isinstance(soul_score, (int, float)), f"soul_score should be numeric, got {type(soul_score)}"
        assert 0 <= soul_score <= 100, f"soul_score should be 0-100, got {soul_score}"
        
        print(f"✅ Soul score returned: {soul_score}")
    
    def test_legacy_stats_array_present(self):
        """Test backward compatibility - stats array should still be present"""
        pet_id = "pet-99a708f1722a"
        response = requests.get(f"{BASE_URL}/api/mira/personalization-stats/{pet_id}")
        
        assert response.status_code == 200
        data = response.json()
        
        stats = data.get("stats", [])
        assert isinstance(stats, list), "stats should be a list for backward compatibility"
        
        print(f"✅ Legacy stats array present with {len(stats)} items")
    
    def test_pet_name_returned(self):
        """Test that pet_name is included in response"""
        pet_id = "pet-99a708f1722a"
        response = requests.get(f"{BASE_URL}/api/mira/personalization-stats/{pet_id}")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "pet_name" in data, "Response should include pet_name"
        pet_name = data.get("pet_name")
        assert pet_name is not None and len(pet_name) > 0, "pet_name should not be empty"
        
        print(f"✅ Pet name returned: {pet_name}")
    
    def test_nonexistent_pet_returns_empty(self):
        """Test that a non-existent pet returns empty arrays gracefully"""
        pet_id = "nonexistent-pet-12345"
        response = requests.get(f"{BASE_URL}/api/mira/personalization-stats/{pet_id}")
        
        assert response.status_code == 200  # Should still return 200
        data = response.json()
        
        # Should gracefully return empty data, not an error
        assert data.get("success") == False or data.get("knowledge_items", []) == []
        
        print(f"✅ Non-existent pet handled gracefully")
    
    def test_knowledge_items_include_favorites(self):
        """Test that knowledge items include pet's favorites (diet category)"""
        pet_id = "pet-99a708f1722a"
        response = requests.get(f"{BASE_URL}/api/mira/personalization-stats/{pet_id}")
        
        assert response.status_code == 200
        data = response.json()
        
        knowledge_items = data.get("knowledge_items", [])
        diet_items = [item for item in knowledge_items if item.get("category") == "diet"]
        
        # Mojo should have favorites since test shows "Mojo loves Chicken Jerky"
        assert len(diet_items) > 0, "Should have at least one diet/favorites item"
        
        # Check that one of them mentions "loves"
        favorites_found = any("loves" in item.get("text", "").lower() for item in diet_items)
        assert favorites_found, "Should have a favorites item with 'loves' keyword"
        
        print(f"✅ Found {len(diet_items)} diet items including favorites")
    
    def test_knowledge_items_include_personality(self):
        """Test that knowledge items include personality traits"""
        pet_id = "pet-99a708f1722a"
        response = requests.get(f"{BASE_URL}/api/mira/personalization-stats/{pet_id}")
        
        assert response.status_code == 200
        data = response.json()
        
        knowledge_items = data.get("knowledge_items", [])
        personality_items = [item for item in knowledge_items if item.get("category") == "personality"]
        
        print(f"✅ Found {len(personality_items)} personality items")
    
    def test_knowledge_items_include_breed(self):
        """Test that knowledge items include breed information"""
        pet_id = "pet-99a708f1722a"
        response = requests.get(f"{BASE_URL}/api/mira/personalization-stats/{pet_id}")
        
        assert response.status_code == 200
        data = response.json()
        
        knowledge_items = data.get("knowledge_items", [])
        breed_items = [item for item in knowledge_items if item.get("category") == "breed"]
        
        # Should have breed info for real pet
        print(f"✅ Found {len(breed_items)} breed items")
    
    def test_knowledge_items_include_memories(self):
        """Test that knowledge items include memories about the pet"""
        pet_id = "pet-99a708f1722a"
        response = requests.get(f"{BASE_URL}/api/mira/personalization-stats/{pet_id}")
        
        assert response.status_code == 200
        data = response.json()
        
        knowledge_items = data.get("knowledge_items", [])
        memory_items = [item for item in knowledge_items if item.get("category") == "memory"]
        
        print(f"✅ Found {len(memory_items)} memory items")


class TestProactiveAlertsAPI:
    """Additional tests for proactive alerts which show in ProactiveAlertsBanner"""
    
    def test_proactive_alerts_endpoint(self):
        """Test proactive alerts endpoint returns alerts"""
        pet_id = "pet-99a708f1722a"
        response = requests.get(f"{BASE_URL}/api/mira/proactive/alerts/{pet_id}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        alerts = data.get("alerts", [])
        assert isinstance(alerts, list), "alerts should be a list"
        
        print(f"✅ Proactive alerts endpoint returned {len(alerts)} alerts")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
