"""
Test Learn Page CMS API endpoints
Testing GET /api/learn/page-config and POST /api/learn/page-config
and AI images status endpoint
"""

import pytest
import requests
import os
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestLearnPageCMSAPI:
    """Test Learn Page CMS API endpoints"""
    
    def test_get_page_config(self):
        """Test GET /api/learn/page-config returns all CMS data"""
        response = requests.get(f"{BASE_URL}/api/learn/page-config")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        # Verify response structure
        assert "config" in data, "Missing 'config' in response"
        assert "topics" in data, "Missing 'topics' in response"
        assert "selectedBundles" in data, "Missing 'selectedBundles' in response"
        assert "selectedProducts" in data, "Missing 'selectedProducts' in response"
        assert "selectedServices" in data, "Missing 'selectedServices' in response"
        assert "dailyTips" in data, "Missing 'dailyTips' in response"
        assert "guidedPaths" in data, "Missing 'guidedPaths' in response"
        assert "helpBuckets" in data, "Missing 'helpBuckets' in response"
        
        print(f"✓ GET page-config returns all expected fields")
        print(f"  - config.title: {data['config'].get('title', 'N/A')}")
        print(f"  - topics count: {len(data['topics'])}")
        print(f"  - dailyTips count: {len(data['dailyTips'])}")
    
    def test_page_config_structure(self):
        """Test page-config has proper config structure"""
        response = requests.get(f"{BASE_URL}/api/learn/page-config")
        
        assert response.status_code == 200
        data = response.json()
        config = data.get("config", {})
        
        # Check config has expected keys
        assert config.get("pillar") == "learn", "config.pillar should be 'learn'"
        assert "title" in config, "config should have 'title'"
        assert "subtitle" in config, "config should have 'subtitle'"
        assert "themeColor" in config, "config should have 'themeColor'"
        
        # Check askMira structure
        ask_mira = config.get("askMira", {})
        assert "enabled" in ask_mira, "askMira should have 'enabled'"
        assert "placeholder" in ask_mira, "askMira should have 'placeholder'"
        assert "buttonColor" in ask_mira, "askMira should have 'buttonColor'"
        
        print(f"✓ Page config structure is valid")
        print(f"  - askMira.enabled: {ask_mira.get('enabled')}")
        print(f"  - themeColor: {config.get('themeColor')}")
    
    def test_topics_structure(self):
        """Test topics have proper structure"""
        response = requests.get(f"{BASE_URL}/api/learn/page-config")
        
        assert response.status_code == 200
        data = response.json()
        topics = data.get("topics", [])
        
        assert len(topics) > 0, "Should have at least one topic"
        
        # Check first topic structure
        topic = topics[0]
        assert "id" in topic, "Topic should have 'id'"
        assert "title" in topic, "Topic should have 'title'"
        assert "slug" in topic, "Topic should have 'slug'"
        assert "description" in topic, "Topic should have 'description'"
        assert "image" in topic, "Topic should have 'image'"
        assert "subtopics" in topic, "Topic should have 'subtopics'"
        assert "videos" in topic, "Topic should have 'videos'"
        assert "products" in topic, "Topic should have 'products'"
        assert "services" in topic, "Topic should have 'services'"
        
        print(f"✓ Topics structure is valid")
        print(f"  - First topic: {topic.get('title')}")
        print(f"  - Total topics: {len(topics)}")
    
    def test_post_page_config(self):
        """Test POST /api/learn/page-config saves CMS data"""
        # First get current config
        get_response = requests.get(f"{BASE_URL}/api/learn/page-config")
        assert get_response.status_code == 200
        original_data = get_response.json()
        
        # Prepare test data with a unique marker
        test_marker = f"TEST_{int(time.time())}"
        test_data = {
            "config": {
                **original_data.get("config", {}),
                "pillar": "learn",
                "title": f"Test Title {test_marker}",
                "subtitle": "Test Subtitle",
                "themeColor": "#f59e0b",
                "askMira": {
                    "enabled": True,
                    "placeholder": f"Test placeholder {test_marker}",
                    "buttonColor": "bg-teal-500",
                    "showSuggestions": True,
                    "suggestions": ["Test suggestion 1", "Test suggestion 2"]
                }
            },
            "topics": original_data.get("topics", []),
            "selectedBundles": ["test-bundle-1"],
            "selectedProducts": ["test-product-1"],
            "selectedServices": ["test-service-1"],
            "dailyTips": [
                {
                    "id": "test-tip-1",
                    "tip": f"Test daily tip {test_marker}",
                    "category": "Training",
                    "color": "from-blue-500 to-indigo-500"
                }
            ],
            "guidedPaths": [
                {
                    "id": "test-path-1",
                    "title": f"Test Path {test_marker}",
                    "topicSlug": "puppy-basics",
                    "steps": ["Step 1", "Step 2"],
                    "color": "blue"
                }
            ],
            "helpBuckets": [
                {
                    "id": "test-bucket-1",
                    "title": "Test Bucket",
                    "icon": "Award",
                    "color": "amber",
                    "items": ["Item 1", "Item 2"]
                }
            ]
        }
        
        # POST the config
        post_response = requests.post(
            f"{BASE_URL}/api/learn/page-config",
            json=test_data,
            headers={"Content-Type": "application/json"}
        )
        
        assert post_response.status_code == 200, f"POST failed: {post_response.text}"
        result = post_response.json()
        assert result.get("success") == True, "POST should return success=True"
        
        print(f"✓ POST page-config succeeded")
        
        # Verify the data was saved by fetching again
        verify_response = requests.get(f"{BASE_URL}/api/learn/page-config")
        assert verify_response.status_code == 200
        saved_data = verify_response.json()
        
        # Verify saved data
        assert test_marker in saved_data["config"].get("title", ""), "Title not saved correctly"
        assert len(saved_data.get("dailyTips", [])) >= 1, "Daily tips not saved"
        assert len(saved_data.get("guidedPaths", [])) >= 1, "Guided paths not saved"
        assert len(saved_data.get("helpBuckets", [])) >= 1, "Help buckets not saved"
        
        print(f"✓ Data persisted correctly after POST")
        
        # Restore original data
        restore_data = {
            "config": original_data.get("config", {}),
            "topics": original_data.get("topics", []),
            "selectedBundles": original_data.get("selectedBundles", []),
            "selectedProducts": original_data.get("selectedProducts", []),
            "selectedServices": original_data.get("selectedServices", []),
            "dailyTips": original_data.get("dailyTips", []),
            "guidedPaths": original_data.get("guidedPaths", []),
            "helpBuckets": original_data.get("helpBuckets", [])
        }
        restore_response = requests.post(
            f"{BASE_URL}/api/learn/page-config",
            json=restore_data,
            headers={"Content-Type": "application/json"}
        )
        assert restore_response.status_code == 200, "Failed to restore original data"
        print(f"✓ Original data restored")


class TestAIImagesStatus:
    """Test AI images generation status endpoint"""
    
    def test_ai_images_status(self):
        """Test GET /api/ai-images/status returns status"""
        response = requests.get(f"{BASE_URL}/api/ai-images/status")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        # Verify response has expected fields
        assert "running" in data, "Missing 'running' in response"
        assert "type" in data, "Missing 'type' in response"
        assert "total" in data, "Missing 'total' in response"
        assert "completed" in data, "Missing 'completed' in response"
        assert "progress" in data, "Missing 'progress' in response"
        
        print(f"✓ AI images status endpoint working")
        print(f"  - running: {data.get('running')}")
        print(f"  - type: {data.get('type')}")
        print(f"  - progress: {data.get('progress')}%")


class TestLearnCMSRelatedEndpoints:
    """Test related endpoints for Learn CMS"""
    
    def test_learn_products(self):
        """Test GET /api/learn/products returns products"""
        response = requests.get(f"{BASE_URL}/api/learn/products")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        assert "products" in data, "Missing 'products' in response"
        assert len(data["products"]) > 0, "Should have at least some products"
        
        print(f"✓ Learn products endpoint returns {len(data['products'])} products")
    
    def test_learn_bundles(self):
        """Test GET /api/learn/bundles returns bundles"""
        response = requests.get(f"{BASE_URL}/api/learn/bundles")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        assert "bundles" in data, "Missing 'bundles' in response"
        
        print(f"✓ Learn bundles endpoint returns {len(data.get('bundles', []))} bundles")
    
    def test_services_for_learn(self):
        """Test GET /api/services returns services"""
        response = requests.get(f"{BASE_URL}/api/services?pillar=learn&limit=50")
        
        # Services endpoint may return 200 or 404 depending on data
        assert response.status_code in [200, 404], f"Unexpected status: {response.status_code}"
        
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Services endpoint returns data")
        else:
            print(f"✓ Services endpoint returns 404 (no services for learn pillar)")
    
    def test_product_box_learn_products(self):
        """Test GET /api/product-box/products with learn pillar"""
        response = requests.get(f"{BASE_URL}/api/product-box/products?pillar=learn&limit=10")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        assert "products" in data, "Missing 'products' in response"
        
        print(f"✓ Product box returns {len(data['products'])} learn products")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
