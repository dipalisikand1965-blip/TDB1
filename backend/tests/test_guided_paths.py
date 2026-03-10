"""
Guided Paths API Tests
Tests for: GET /api/guided-paths/{pillar} endpoints for farewell, adopt, emergency, advisory
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestGuidedPathsAPI:
    """Test guided paths API endpoints for all pillars"""

    def test_farewell_paths(self):
        """Test GET /api/guided-paths/farewell returns farewell journey paths"""
        response = requests.get(f"{BASE_URL}/api/guided-paths/farewell")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "pillar" in data
        assert data["pillar"] == "farewell"
        assert "paths" in data
        assert "total" in data
        
        # Should have at least 4 farewell paths
        assert len(data["paths"]) >= 4, f"Expected at least 4 farewell paths, got {len(data['paths'])}"
        
        # Validate path structure
        for path in data["paths"]:
            assert "id" in path
            assert "title" in path
            assert "description" in path
            assert "icon" in path
            assert "color" in path
            assert "steps" in path
            assert path["pillar"] == "farewell"
        
        print(f"✓ Farewell paths: {data['total']} paths returned")

    def test_adopt_paths(self):
        """Test GET /api/guided-paths/adopt returns adoption journey paths"""
        response = requests.get(f"{BASE_URL}/api/guided-paths/adopt")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data["pillar"] == "adopt"
        assert "paths" in data
        
        # Should have at least 4 adoption paths
        assert len(data["paths"]) >= 4, f"Expected at least 4 adopt paths, got {len(data['paths'])}"
        
        # Check for specific adoption paths
        path_ids = [p["id"] for p in data["paths"]]
        expected_ids = ["adopt-before", "adopt-first-7-days", "adopt-first-3-weeks", "adopt-first-3-months"]
        for expected in expected_ids:
            assert expected in path_ids, f"Missing path: {expected}"
        
        print(f"✓ Adopt paths: {data['total']} paths returned")

    def test_emergency_paths(self):
        """Test GET /api/guided-paths/emergency returns emergency guides"""
        response = requests.get(f"{BASE_URL}/api/guided-paths/emergency")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data["pillar"] == "emergency"
        assert "paths" in data
        
        # Should have at least 8 emergency guides
        assert len(data["paths"]) >= 8, f"Expected at least 8 emergency paths, got {len(data['paths'])}"
        
        # Check for specific emergency guides
        path_ids = [p["id"] for p in data["paths"]]
        expected_ids = ["emergency-poisoning", "emergency-bleeding", "emergency-breathing", "emergency-heatstroke"]
        for expected in expected_ids:
            assert expected in path_ids, f"Missing path: {expected}"
        
        print(f"✓ Emergency paths: {data['total']} paths returned")

    def test_advisory_paths(self):
        """Test GET /api/guided-paths/advisory returns advisory paths"""
        response = requests.get(f"{BASE_URL}/api/guided-paths/advisory")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data["pillar"] == "advisory"
        assert "paths" in data
        
        # Should have at least 4 advisory paths
        assert len(data["paths"]) >= 4, f"Expected at least 4 advisory paths, got {len(data['paths'])}"
        
        print(f"✓ Advisory paths: {data['total']} paths returned")

    def test_path_step_structure(self):
        """Test that each path has properly structured steps with title and items"""
        response = requests.get(f"{BASE_URL}/api/guided-paths/farewell")
        assert response.status_code == 200
        
        data = response.json()
        for path in data["paths"]:
            assert "steps" in path
            assert len(path["steps"]) > 0, f"Path {path['id']} has no steps"
            
            for step in path["steps"]:
                assert "title" in step, f"Step in {path['id']} missing title"
                assert "items" in step, f"Step in {path['id']} missing items"
                assert isinstance(step["items"], list), f"Items should be a list"
                assert len(step["items"]) > 0, f"Step {step['title']} has no items"
        
        print("✓ All paths have properly structured steps")

    def test_paths_are_ordered(self):
        """Test that paths are returned in order by the 'order' field"""
        response = requests.get(f"{BASE_URL}/api/guided-paths/farewell")
        assert response.status_code == 200
        
        data = response.json()
        orders = [p.get("order", 0) for p in data["paths"]]
        assert orders == sorted(orders), "Paths should be sorted by order"
        
        print("✓ Paths are correctly ordered")

    def test_nonexistent_pillar_returns_empty(self):
        """Test that requesting non-existent pillar returns empty paths list"""
        response = requests.get(f"{BASE_URL}/api/guided-paths/nonexistent")
        assert response.status_code == 200
        
        data = response.json()
        assert data["pillar"] == "nonexistent"
        assert data["paths"] == []
        assert data["total"] == 0
        
        print("✓ Non-existent pillar returns empty paths")


class TestGuidedPathsAdmin:
    """Test admin endpoints for guided paths"""

    def test_admin_stats(self):
        """Test GET /api/guided-paths/admin/stats returns statistics"""
        response = requests.get(f"{BASE_URL}/api/guided-paths/admin/stats")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "total" in data
        assert "active" in data
        assert "by_pillar" in data
        
        # Should have paths in all 4 pillars
        assert data["by_pillar"].get("farewell", 0) >= 4
        assert data["by_pillar"].get("adopt", 0) >= 4
        assert data["by_pillar"].get("advisory", 0) >= 4
        assert data["by_pillar"].get("emergency", 0) >= 8
        
        print(f"✓ Stats: Total={data['total']}, Active={data['active']}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
