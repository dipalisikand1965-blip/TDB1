"""
Test Guided Paths API endpoints for Emergency and Advisory pillars
Tests API response structure, data content, and integration
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestEmergencyGuidedPathsAPI:
    """Tests for /api/guided-paths/emergency endpoint"""
    
    def test_emergency_api_returns_200(self):
        """Test emergency API returns 200 OK"""
        response = requests.get(f"{BASE_URL}/api/guided-paths/emergency")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("PASS: Emergency API returns 200")
    
    def test_emergency_api_returns_8_paths(self):
        """Test emergency API returns 8 paths as per seed data"""
        response = requests.get(f"{BASE_URL}/api/guided-paths/emergency")
        assert response.status_code == 200
        data = response.json()
        assert "paths" in data, "Response missing 'paths' key"
        assert "total" in data, "Response missing 'total' key"
        assert data["total"] == 8, f"Expected 8 emergency paths, got {data['total']}"
        assert len(data["paths"]) == 8, f"Expected 8 paths in array, got {len(data['paths'])}"
        print(f"PASS: Emergency API returns {data['total']} paths")
    
    def test_emergency_api_paths_have_required_fields(self):
        """Test emergency paths have all required fields for UI rendering"""
        response = requests.get(f"{BASE_URL}/api/guided-paths/emergency")
        assert response.status_code == 200
        data = response.json()
        
        required_fields = ["id", "title", "description", "icon", "steps", "is_active"]
        
        for path in data["paths"]:
            for field in required_fields:
                assert field in path, f"Path '{path.get('id', 'unknown')}' missing field '{field}'"
            
            # Verify steps structure
            assert isinstance(path["steps"], list), f"Steps should be list for {path['id']}"
            assert len(path["steps"]) > 0, f"Path {path['id']} has no steps"
            
            for step in path["steps"]:
                assert "title" in step, f"Step missing 'title' in path {path['id']}"
                assert "items" in step, f"Step missing 'items' in path {path['id']}"
                assert isinstance(step["items"], list), f"Step items should be list in path {path['id']}"
        
        print("PASS: All emergency paths have required fields")
    
    def test_emergency_paths_have_expected_titles(self):
        """Verify specific emergency paths exist with correct titles"""
        response = requests.get(f"{BASE_URL}/api/guided-paths/emergency")
        assert response.status_code == 200
        data = response.json()
        
        expected_titles = [
            "Suspected Poisoning",
            "Severe Bleeding", 
            "Breathing Difficulties",
            "Heat Stroke",
            "Seizures",
            "Choking",
            "Eye Injury or Irritation",
            "Bloat / Twisted Stomach (GDV)"
        ]
        
        actual_titles = [p["title"] for p in data["paths"]]
        
        for title in expected_titles:
            assert title in actual_titles, f"Expected emergency guide '{title}' not found"
        
        print(f"PASS: All {len(expected_titles)} expected emergency titles found")
    
    def test_emergency_paths_have_severity_field(self):
        """Test emergency paths have severity for UI urgency display"""
        response = requests.get(f"{BASE_URL}/api/guided-paths/emergency")
        assert response.status_code == 200
        data = response.json()
        
        # Check that severity exists in most paths (UI uses it for urgency display)
        paths_with_severity = [p for p in data["paths"] if "severity" in p]
        assert len(paths_with_severity) >= 6, f"Expected at least 6 paths with severity, got {len(paths_with_severity)}"
        
        print(f"PASS: {len(paths_with_severity)}/{len(data['paths'])} emergency paths have severity field")


class TestAdvisoryGuidedPathsAPI:
    """Tests for /api/guided-paths/advisory endpoint"""
    
    def test_advisory_api_returns_200(self):
        """Test advisory API returns 200 OK"""
        response = requests.get(f"{BASE_URL}/api/guided-paths/advisory")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("PASS: Advisory API returns 200")
    
    def test_advisory_api_returns_4_paths(self):
        """Test advisory API returns 4 paths as per seed data"""
        response = requests.get(f"{BASE_URL}/api/guided-paths/advisory")
        assert response.status_code == 200
        data = response.json()
        assert "paths" in data, "Response missing 'paths' key"
        assert "total" in data, "Response missing 'total' key"
        assert data["total"] == 4, f"Expected 4 advisory paths, got {data['total']}"
        assert len(data["paths"]) == 4, f"Expected 4 paths in array, got {len(data['paths'])}"
        print(f"PASS: Advisory API returns {data['total']} paths")
    
    def test_advisory_api_paths_have_required_fields(self):
        """Test advisory paths have all required fields for UI rendering"""
        response = requests.get(f"{BASE_URL}/api/guided-paths/advisory")
        assert response.status_code == 200
        data = response.json()
        
        required_fields = ["id", "title", "description", "icon", "steps", "is_active", "color"]
        
        for path in data["paths"]:
            for field in required_fields:
                assert field in path, f"Path '{path.get('id', 'unknown')}' missing field '{field}'"
            
            # Verify steps structure
            assert isinstance(path["steps"], list), f"Steps should be list for {path['id']}"
            assert len(path["steps"]) > 0, f"Path {path['id']} has no steps"
            
            for step in path["steps"]:
                assert "title" in step, f"Step missing 'title' in path {path['id']}"
                assert "items" in step, f"Step missing 'items' in path {path['id']}"
        
        print("PASS: All advisory paths have required fields")
    
    def test_advisory_paths_have_expected_titles(self):
        """Verify specific advisory paths exist with correct titles"""
        response = requests.get(f"{BASE_URL}/api/guided-paths/advisory")
        assert response.status_code == 200
        data = response.json()
        
        expected_titles = [
            "First-time Owner Path",
            "Multi-dog Household",
            "Flat-faced Dog Care",
            "Allergy Management Path"
        ]
        
        actual_titles = [p["title"] for p in data["paths"]]
        
        for title in expected_titles:
            assert title in actual_titles, f"Expected advisory path '{title}' not found"
        
        print(f"PASS: All {len(expected_titles)} expected advisory titles found")
    
    def test_advisory_paths_have_icon_mapping(self):
        """Test advisory paths have icon field for UI icon display"""
        response = requests.get(f"{BASE_URL}/api/guided-paths/advisory")
        assert response.status_code == 200
        data = response.json()
        
        valid_icons = ["Heart", "Users", "Shield", "Baby", "Dog", "Plane", "Scissors", "Brain", "Home"]
        
        for path in data["paths"]:
            assert "icon" in path, f"Path {path['id']} missing icon"
            assert path["icon"] in valid_icons, f"Path {path['id']} has invalid icon: {path['icon']}"
        
        print("PASS: All advisory paths have valid icon mappings")


class TestGuidedPathsAPIStructure:
    """Tests for overall API response structure"""
    
    def test_emergency_response_includes_pillar_field(self):
        """Test emergency response includes pillar identifier"""
        response = requests.get(f"{BASE_URL}/api/guided-paths/emergency")
        assert response.status_code == 200
        data = response.json()
        assert data.get("pillar") == "emergency", f"Expected pillar='emergency', got '{data.get('pillar')}'"
        print("PASS: Emergency response includes pillar='emergency'")
    
    def test_advisory_response_includes_pillar_field(self):
        """Test advisory response includes pillar identifier"""
        response = requests.get(f"{BASE_URL}/api/guided-paths/advisory")
        assert response.status_code == 200
        data = response.json()
        assert data.get("pillar") == "advisory", f"Expected pillar='advisory', got '{data.get('pillar')}'"
        print("PASS: Advisory response includes pillar='advisory'")
    
    def test_paths_ordered_correctly(self):
        """Test paths are returned in correct order"""
        for pillar in ["emergency", "advisory"]:
            response = requests.get(f"{BASE_URL}/api/guided-paths/{pillar}")
            assert response.status_code == 200
            data = response.json()
            
            orders = [p.get("order", 0) for p in data["paths"]]
            assert orders == sorted(orders), f"{pillar} paths not in order: {orders}"
        
        print("PASS: All paths are correctly ordered")
    
    def test_paths_are_active(self):
        """Test all returned paths are active"""
        for pillar in ["emergency", "advisory"]:
            response = requests.get(f"{BASE_URL}/api/guided-paths/{pillar}")
            assert response.status_code == 200
            data = response.json()
            
            for path in data["paths"]:
                assert path.get("is_active") == True, f"Path {path['id']} is not active"
        
        print("PASS: All returned paths are active")


# Run tests if executed directly
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
