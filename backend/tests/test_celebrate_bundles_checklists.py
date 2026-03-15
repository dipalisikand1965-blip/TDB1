"""
Test Celebrate Bundles and Checklists API
Testing P0 (Bundles) and P1 (PDF Download/Checklists) features

Created: Jan 2026
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://architecture-rebuild.preview.emergentagent.com').rstrip('/')

class TestCelebrateBundlesAPI:
    """Test celebrate bundles API - P0 Fix verification"""
    
    def test_get_celebrate_bundles_returns_6_bundles(self):
        """GET /api/celebrate/bundles should return exactly 6 bundles"""
        response = requests.get(f"{BASE_URL}/api/celebrate/bundles")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "bundles" in data, "Response should have 'bundles' key"
        
        bundles = data["bundles"]
        assert len(bundles) == 6, f"Expected 6 bundles, got {len(bundles)}"
    
    def test_celebrate_bundles_have_required_fields(self):
        """Each bundle should have required fields: id, name, price, items"""
        response = requests.get(f"{BASE_URL}/api/celebrate/bundles")
        
        assert response.status_code == 200
        data = response.json()
        
        required_fields = ['id', 'name', 'price', 'items', 'description']
        for bundle in data["bundles"]:
            for field in required_fields:
                assert field in bundle, f"Bundle missing required field: {field}"
            
            # Items should be a non-empty list
            assert isinstance(bundle['items'], list), "Items should be a list"
            assert len(bundle['items']) > 0, f"Bundle {bundle['name']} has no items"
    
    def test_celebrate_bundles_contain_expected_bundles(self):
        """Verify the 6 new bundles are present"""
        response = requests.get(f"{BASE_URL}/api/celebrate/bundles")
        
        assert response.status_code == 200
        data = response.json()
        
        bundle_names = [b['name'] for b in data['bundles']]
        
        expected_bundles = [
            'First Birthday Special',
            'Premium Bark-day Bash',
            'Pawty Essentials',
            'Senior Celebration',
            'Adoption Anniversary',
            'New Puppy Welcome'
        ]
        
        for expected in expected_bundles:
            assert expected in bundle_names, f"Expected bundle '{expected}' not found"
    
    def test_celebrate_bundles_have_valid_prices(self):
        """All bundles should have positive prices"""
        response = requests.get(f"{BASE_URL}/api/celebrate/bundles")
        
        assert response.status_code == 200
        data = response.json()
        
        for bundle in data['bundles']:
            assert bundle['price'] > 0, f"Bundle {bundle['name']} has invalid price"
            if bundle.get('original_price'):
                assert bundle['original_price'] > bundle['price'], \
                    f"Bundle {bundle['name']} original_price should be > price"


class TestChecklistsAPI:
    """Test checklists API - P1 PDF Download feature"""
    
    def test_get_all_available_checklists(self):
        """GET /api/checklists/all/available should return 14 checklists"""
        response = requests.get(f"{BASE_URL}/api/checklists/all/available")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "total" in data, "Response should have 'total' key"
        assert "checklists" in data, "Response should have 'checklists' key"
        assert data["total"] == 14, f"Expected 14 checklists, got {data['total']}"
    
    def test_get_adopt_checklists(self):
        """GET /api/checklists/adopt should return 2 checklists"""
        response = requests.get(f"{BASE_URL}/api/checklists/adopt")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "pillar" in data, "Response should have 'pillar' key"
        assert data["pillar"] == "adopt"
        assert "checklists" in data
        assert len(data["checklists"]) == 2, f"Expected 2 adopt checklists, got {len(data['checklists'])}"
        
        # Verify checklist IDs
        checklist_ids = [c['id'] for c in data['checklists']]
        assert 'welcome_home' in checklist_ids
        assert 'first_vet_visit' in checklist_ids
    
    def test_get_celebrate_checklist(self):
        """GET /api/checklists/celebrate should return birthday_party checklist"""
        response = requests.get(f"{BASE_URL}/api/checklists/celebrate")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["pillar"] == "celebrate"
        checklist_ids = [c['id'] for c in data['checklists']]
        assert 'birthday_party' in checklist_ids
    
    def test_get_specific_checklist_with_sections(self):
        """GET /api/checklists/adopt/welcome_home should return full checklist data"""
        response = requests.get(f"{BASE_URL}/api/checklists/adopt/welcome_home")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "checklist" in data
        checklist = data["checklist"]
        
        # Verify structure
        assert "id" in checklist
        assert "title" in checklist
        assert "sections" in checklist
        assert len(checklist["sections"]) > 0, "Checklist should have sections"
        
        # Verify sections have items
        for section in checklist["sections"]:
            assert "title" in section
            assert "items" in section
            assert len(section["items"]) > 0, f"Section {section['title']} should have items"
    
    def test_checklists_have_required_metadata(self):
        """All checklists should have id, title, subtitle, icon, color"""
        response = requests.get(f"{BASE_URL}/api/checklists/all/available")
        
        assert response.status_code == 200
        data = response.json()
        
        required_fields = ['pillar', 'id', 'title', 'subtitle', 'icon', 'color']
        for checklist in data['checklists']:
            for field in required_fields:
                assert field in checklist, f"Checklist missing field: {field}"
    
    def test_personalized_checklist_endpoint(self):
        """GET /api/checklists/{pillar}/{id}/personalized should work with query params"""
        params = "?pet_name=Bruno&breed=Labrador&life_stage=Adult"
        response = requests.get(f"{BASE_URL}/api/checklists/adopt/welcome_home/personalized{params}")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "checklist" in data
        assert "personalization" in data
        assert data["personalization"]["pet_name"] == "Bruno"
        assert data["personalization"]["breed"] == "Labrador"


class TestCelebrateBundlesIntegration:
    """Integration tests for CuratedBundles component API usage"""
    
    def test_curated_bundles_api_format_matches_frontend_expectation(self):
        """Verify API response format matches CuratedBundles.jsx expectations"""
        response = requests.get(f"{BASE_URL}/api/celebrate/bundles")
        
        assert response.status_code == 200
        data = response.json()
        
        # CuratedBundles.jsx expects: bundles array with price/bundle_price field
        for bundle in data['bundles']:
            # Frontend looks for 'price' or 'bundle_price'
            assert 'price' in bundle or 'bundle_price' in bundle, \
                "Bundle needs price or bundle_price field"
            
            # Frontend displays image from 'image' field
            assert 'image' in bundle, "Bundle needs image field"
            
            # Frontend needs items array for "What's Included"
            assert 'items' in bundle and isinstance(bundle['items'], list)


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
