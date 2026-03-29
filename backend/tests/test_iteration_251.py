"""
Iteration 251 Backend Tests
Tests for:
1. Personalization-stats API returning 'Meister loves Jerky' for pet-meister-0faaab39
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestPersonalizationStats:
    """Personalization stats endpoint tests for Meister treats fix"""

    def test_personalization_stats_returns_success(self):
        """GET /api/mira/personalization-stats/pet-meister-0faaab39 returns success"""
        response = requests.get(f"{BASE_URL}/api/mira/personalization-stats/pet-meister-0faaab39")
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") is True
        print("PASS: personalization-stats returns success")

    def test_personalization_stats_pet_name_is_meister(self):
        """GET /api/mira/personalization-stats/pet-meister-0faaab39 returns Meister as pet_name"""
        response = requests.get(f"{BASE_URL}/api/mira/personalization-stats/pet-meister-0faaab39")
        assert response.status_code == 200
        data = response.json()
        assert data.get("pet_name") == "Meister"
        print("PASS: pet_name is Meister")

    def test_personalization_stats_has_jerky_knowledge_item(self):
        """GET /api/mira/personalization-stats/pet-meister-0faaab39 has 'Meister loves Jerky' in knowledge_items"""
        response = requests.get(f"{BASE_URL}/api/mira/personalization-stats/pet-meister-0faaab39")
        assert response.status_code == 200
        data = response.json()
        
        knowledge_items = data.get("knowledge_items", [])
        assert len(knowledge_items) > 0, "knowledge_items should not be empty"
        
        # Check for 'Meister loves Jerky' text
        jerky_items = [item for item in knowledge_items if "Jerky" in item.get("text", "")]
        assert len(jerky_items) > 0, f"Expected 'Meister loves Jerky' in knowledge_items, got: {[i['text'] for i in knowledge_items]}"
        
        jerky_item = jerky_items[0]
        assert "Meister loves Jerky" in jerky_item["text"], f"Expected 'Meister loves Jerky', got: {jerky_item['text']}"
        assert jerky_item.get("category") == "diet", f"Expected category 'diet', got: {jerky_item.get('category')}"
        assert jerky_item.get("priority") == 8, f"Expected priority 8, got: {jerky_item.get('priority')}"
        print(f"PASS: Found knowledge item: {jerky_item['text']} (category={jerky_item['category']}, priority={jerky_item['priority']})")

    def test_personalization_stats_has_soul_score(self):
        """GET /api/mira/personalization-stats/pet-meister-0faaab39 returns a soul_score"""
        response = requests.get(f"{BASE_URL}/api/mira/personalization-stats/pet-meister-0faaab39")
        assert response.status_code == 200
        data = response.json()
        assert "soul_score" in data
        assert isinstance(data["soul_score"], (int, float))
        assert data["soul_score"] > 0
        print(f"PASS: soul_score = {data['soul_score']}")
