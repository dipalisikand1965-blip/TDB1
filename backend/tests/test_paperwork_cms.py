"""
Paperwork Page CMS API Tests
Tests all CMS functionality: page config, document categories, checklist, reminders, concierge services, mira prompts
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://pet-soul-journey.preview.emergentagent.com').rstrip('/')


class TestPaperworkPageConfigAPI:
    """Test GET /api/paperwork/page-config endpoint"""
    
    def test_get_page_config_success(self):
        """Test that GET returns all CMS data"""
        response = requests.get(f"{BASE_URL}/api/paperwork/page-config")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        
        # Check all required keys exist
        required_keys = ['config', 'documentCategories', 'checklistItems', 'reminderTemplates', 
                        'conciergeServices', 'miraPrompts', 'selectedProducts', 'selectedBundles', 
                        'selectedServices', 'personalizationConfig']
        for key in required_keys:
            assert key in data, f"Missing key: {key}"
    
    def test_document_categories_structure(self):
        """Test document categories have correct structure"""
        response = requests.get(f"{BASE_URL}/api/paperwork/page-config")
        assert response.status_code == 200
        
        data = response.json()
        categories = data.get('documentCategories', [])
        
        assert len(categories) >= 6, f"Expected at least 6 categories, got {len(categories)}"
        
        # Check first category structure
        if categories:
            cat = categories[0]
            assert 'name' in cat, "Category missing 'name'"
            assert 'icon' in cat, "Category missing 'icon'"
            assert 'color' in cat, "Category missing 'color'"
            assert 'subcategories' in cat, "Category missing 'subcategories'"
    
    def test_checklist_items(self):
        """Test checklist items are present"""
        response = requests.get(f"{BASE_URL}/api/paperwork/page-config")
        assert response.status_code == 200
        
        data = response.json()
        checklist = data.get('checklistItems', [])
        
        assert len(checklist) >= 6, f"Expected at least 6 checklist items, got {len(checklist)}"
        
        # Verify structure
        if checklist:
            item = checklist[0]
            assert 'id' in item or 'name' in item, "Checklist item missing id/name"
            assert 'essential' in item, "Checklist item missing 'essential' field"
    
    def test_reminder_templates(self):
        """Test reminder templates are present with timing and channels"""
        response = requests.get(f"{BASE_URL}/api/paperwork/page-config")
        assert response.status_code == 200
        
        data = response.json()
        reminders = data.get('reminderTemplates', [])
        
        assert len(reminders) >= 5, f"Expected at least 5 reminder templates, got {len(reminders)}"
        
        # Verify structure
        if reminders:
            reminder = reminders[0]
            assert 'name' in reminder, "Reminder missing 'name'"
            assert 'defaultDays' in reminder or 'message' in reminder, "Reminder missing timing/message"
            assert 'channels' in reminder, "Reminder missing 'channels'"
    
    def test_concierge_services(self):
        """Test concierge services have pricing and includes"""
        response = requests.get(f"{BASE_URL}/api/paperwork/page-config")
        assert response.status_code == 200
        
        data = response.json()
        services = data.get('conciergeServices', [])
        
        assert len(services) >= 6, f"Expected at least 6 concierge services, got {len(services)}"
        
        # Verify structure
        if services:
            svc = services[0]
            assert 'name' in svc, "Concierge service missing 'name'"
            assert 'price' in svc or svc.get('price') == 0, "Concierge service missing 'price'"
            assert 'includes' in svc, "Concierge service missing 'includes'"
            assert 'turnaround' in svc, "Concierge service missing 'turnaround'"
    
    def test_mira_prompts(self):
        """Test Mira prompts have contextual tips, reminders, suggestions, nudges"""
        response = requests.get(f"{BASE_URL}/api/paperwork/page-config")
        assert response.status_code == 200
        
        data = response.json()
        prompts = data.get('miraPrompts', [])
        
        assert len(prompts) >= 6, f"Expected at least 6 Mira prompts, got {len(prompts)}"
        
        # Verify structure
        if prompts:
            prompt = prompts[0]
            assert 'type' in prompt, "Mira prompt missing 'type'"
            assert 'message' in prompt, "Mira prompt missing 'message'"
        
        # Check for different types
        types = [p.get('type') for p in prompts]
        assert 'tip' in types or 'reminder' in types, "Expected at least tip or reminder type prompts"
    
    def test_ask_mira_config(self):
        """Test Ask Mira bar configuration"""
        response = requests.get(f"{BASE_URL}/api/paperwork/page-config")
        assert response.status_code == 200
        
        data = response.json()
        config = data.get('config', {})
        ask_mira = config.get('askMira', {})
        
        assert 'enabled' in ask_mira, "Ask Mira missing 'enabled'"
        assert 'placeholder' in ask_mira, "Ask Mira missing 'placeholder'"
        assert 'suggestions' in ask_mira, "Ask Mira missing 'suggestions'"
    
    def test_page_title_with_petname(self):
        """Test page title contains {petName} placeholder"""
        response = requests.get(f"{BASE_URL}/api/paperwork/page-config")
        assert response.status_code == 200
        
        data = response.json()
        config = data.get('config', {})
        title = config.get('title', '')
        
        assert '{petName}' in title or 'petName' in title, f"Title missing {{petName}} placeholder: {title}"


class TestPaperworkPageConfigSave:
    """Test POST /api/paperwork/page-config endpoint"""
    
    def test_save_config_success(self):
        """Test saving CMS configuration"""
        # First get current config
        get_response = requests.get(f"{BASE_URL}/api/paperwork/page-config")
        assert get_response.status_code == 200
        current_data = get_response.json()
        
        # Modify and save
        new_title = f"Test Title - {os.urandom(4).hex()}"
        save_payload = {
            "config": {
                **current_data.get('config', {}),
                "title": new_title,
                "pillar": "paperwork"
            },
            "documentCategories": current_data.get('documentCategories', []),
            "checklistItems": current_data.get('checklistItems', []),
            "reminderTemplates": current_data.get('reminderTemplates', []),
            "conciergeServices": current_data.get('conciergeServices', []),
            "miraPrompts": current_data.get('miraPrompts', [])
        }
        
        response = requests.post(
            f"{BASE_URL}/api/paperwork/page-config",
            json=save_payload
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        result = response.json()
        assert result.get('success') == True, f"Expected success=true: {result}"
        
        # Verify save worked
        verify_response = requests.get(f"{BASE_URL}/api/paperwork/page-config")
        verify_data = verify_response.json()
        assert verify_data.get('config', {}).get('title') == new_title, "Title not saved correctly"
    
    def test_save_adds_new_checklist_item(self):
        """Test adding a new checklist item"""
        # Get current
        get_response = requests.get(f"{BASE_URL}/api/paperwork/page-config")
        current_data = get_response.json()
        
        # Add new item
        new_item = {
            "id": f"test-item-{os.urandom(4).hex()}",
            "name": "Test Checklist Item",
            "category": "identity",
            "essential": False,
            "description": "Test item for testing"
        }
        checklist = current_data.get('checklistItems', []) + [new_item]
        
        save_payload = {
            "config": current_data.get('config', {}),
            "documentCategories": current_data.get('documentCategories', []),
            "checklistItems": checklist,
            "reminderTemplates": current_data.get('reminderTemplates', []),
            "conciergeServices": current_data.get('conciergeServices', []),
            "miraPrompts": current_data.get('miraPrompts', [])
        }
        
        response = requests.post(f"{BASE_URL}/api/paperwork/page-config", json=save_payload)
        assert response.status_code == 200
        
        # Verify
        verify_response = requests.get(f"{BASE_URL}/api/paperwork/page-config")
        verify_data = verify_response.json()
        saved_checklist = verify_data.get('checklistItems', [])
        item_ids = [i.get('id') for i in saved_checklist]
        assert new_item['id'] in item_ids, "New checklist item not saved"


class TestPaperworkDocumentCategories:
    """Test document categories configuration"""
    
    def test_six_document_categories(self):
        """Verify all 6 document folder categories exist"""
        response = requests.get(f"{BASE_URL}/api/paperwork/page-config")
        data = response.json()
        categories = data.get('documentCategories', [])
        
        expected_categories = ["Identity & Safety", "Medical & Health", "Travel Documents", 
                             "Insurance & Financial", "Care & Training", "Legal & Compliance"]
        
        category_names = [c.get('name') for c in categories]
        for expected in expected_categories:
            assert any(expected in name for name in category_names), f"Missing category: {expected}"
    
    def test_categories_have_subcategories(self):
        """Verify categories have subcategories with required fields"""
        response = requests.get(f"{BASE_URL}/api/paperwork/page-config")
        data = response.json()
        categories = data.get('documentCategories', [])
        
        for cat in categories:
            subcats = cat.get('subcategories', [])
            assert len(subcats) >= 1, f"Category {cat.get('name')} has no subcategories"
            
            for sub in subcats:
                assert 'name' in sub, f"Subcategory missing name in {cat.get('name')}"


class TestPaperworkProductsAndBundles:
    """Test products and bundles endpoints"""
    
    def test_get_paperwork_products(self):
        """Test GET /api/paperwork/products"""
        response = requests.get(f"{BASE_URL}/api/paperwork/products")
        # Products may be empty but endpoint should work
        assert response.status_code == 200
        
        data = response.json()
        assert 'products' in data, "Missing 'products' key"
    
    def test_get_paperwork_bundles(self):
        """Test GET /api/paperwork/bundles"""
        response = requests.get(f"{BASE_URL}/api/paperwork/bundles")
        # Bundles may be empty but endpoint should work
        assert response.status_code == 200
        
        data = response.json()
        assert 'bundles' in data, "Missing 'bundles' key"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
