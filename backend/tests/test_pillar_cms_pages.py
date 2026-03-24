"""
Test Paperwork and Stay Pillar Pages CMS Integration
Tests that both pages:
1. Load CMS configuration from API
2. Have Ask Mira section at top
3. Display products and bundles correctly
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://learn-pillar-audit.preview.emergentagent.com')

class TestPaperworkPageCMS:
    """Tests for Paperwork pillar page CMS integration"""
    
    def test_paperwork_page_config_endpoint(self):
        """Test GET /api/paperwork/page-config returns valid config"""
        response = requests.get(f"{BASE_URL}/api/paperwork/page-config")
        assert response.status_code == 200
        
        data = response.json()
        
        # Verify required keys exist
        assert "config" in data
        assert "documentCategories" in data
        
        # Verify config has expected values
        config = data.get("config", {})
        print(f"Paperwork config keys: {config.keys()}")
        
        # CMS config should have title with {petName} placeholder
        if "title" in config:
            print(f"Title: {config['title']}")
            assert "{petName}" in config["title"] or "pet" in config["title"].lower()
        
        # Ask Mira should be enabled
        if "askMira" in config:
            print(f"Ask Mira config: {config['askMira']}")
            assert config["askMira"].get("enabled", True) == True
            
        # Sections should be defined
        if "sections" in config:
            sections = config["sections"]
            print(f"Sections: {list(sections.keys())}")
            # askMira section should be enabled
            if "askMira" in sections:
                assert sections["askMira"].get("enabled", True) != False
    
    def test_paperwork_document_categories(self):
        """Test that document categories are returned"""
        response = requests.get(f"{BASE_URL}/api/paperwork/page-config")
        assert response.status_code == 200
        
        data = response.json()
        categories = data.get("documentCategories", [])
        
        print(f"Number of document categories: {len(categories)}")
        
        # Should have at least identity and medical categories
        assert len(categories) >= 2
        
        # Check category structure
        if categories:
            cat = categories[0]
            print(f"First category: {cat.get('name', 'Unknown')}")
            assert "id" in cat or "name" in cat
    
    def test_paperwork_products_endpoint(self):
        """Test GET /api/paperwork/products returns products"""
        response = requests.get(f"{BASE_URL}/api/paperwork/products")
        assert response.status_code == 200
        
        data = response.json()
        products = data.get("products", [])
        print(f"Number of paperwork products: {len(products)}")
        
        # Should have products defined
        assert "products" in data
    
    def test_paperwork_bundles_endpoint(self):
        """Test GET /api/paperwork/bundles returns bundles"""
        response = requests.get(f"{BASE_URL}/api/paperwork/bundles")
        assert response.status_code == 200
        
        data = response.json()
        bundles = data.get("bundles", [])
        print(f"Number of paperwork bundles: {len(bundles)}")
        
        # Should have bundles
        assert "bundles" in data


class TestStayPageCMS:
    """Tests for Stay pillar page CMS integration"""
    
    def test_stay_page_config_endpoint(self):
        """Test GET /api/stay/page-config returns valid config"""
        response = requests.get(f"{BASE_URL}/api/stay/page-config")
        assert response.status_code == 200
        
        data = response.json()
        
        # Verify response structure
        print(f"Stay page config keys: {data.keys()}")
        assert "config" in data
        
        # Config can be empty but endpoint should work
        config = data.get("config", {})
        print(f"Stay config: {config}")
    
    def test_stay_properties_endpoint(self):
        """Test GET /api/stay/properties returns properties"""
        response = requests.get(f"{BASE_URL}/api/stay/properties")
        assert response.status_code == 200
        
        data = response.json()
        properties = data.get("properties", [])
        print(f"Number of stay properties: {len(properties)}")
        
        assert "properties" in data
    
    def test_stay_boarding_endpoint(self):
        """Test GET /api/stay/boarding returns boarding facilities"""
        response = requests.get(f"{BASE_URL}/api/stay/boarding")
        assert response.status_code == 200
        
        data = response.json()
        facilities = data.get("facilities", [])
        print(f"Number of boarding facilities: {len(facilities)}")
        
        assert "facilities" in data


class TestGenericPillarCMS:
    """Tests for generic pillar CMS endpoint"""
    
    def test_generic_cms_endpoint_for_stay(self):
        """Test that stay uses generic CMS endpoint correctly"""
        response = requests.get(f"{BASE_URL}/api/stay/page-config")
        assert response.status_code == 200
        
        data = response.json()
        
        # Should have personalization config with defaults
        personalization = data.get("personalizationConfig", {})
        print(f"Personalization config: {personalization}")
        
        # Default personalization should be enabled
        if personalization:
            assert personalization.get("breedSmart", {}).get("enabled", True) == True
    
    def test_paperwork_has_dedicated_route(self):
        """Test that paperwork uses dedicated route (not generic)"""
        response = requests.get(f"{BASE_URL}/api/paperwork/page-config")
        assert response.status_code == 200
        
        data = response.json()
        
        # Paperwork should have documentCategories key (specific to paperwork route)
        assert "documentCategories" in data
        
        # Should have more detailed config than generic route
        config = data.get("config", {})
        if config:
            # Paperwork specific config
            print(f"Paperwork has subtitle: {'subtitle' in config}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
