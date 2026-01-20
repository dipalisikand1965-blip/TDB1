"""
PAPERWORK Pillar API Tests
Tests for document vault, products, bundles, categories, and admin endpoints
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestPaperworkProducts:
    """Test /api/paperwork/products endpoint"""
    
    def test_get_products_success(self):
        """Test getting paperwork products"""
        response = requests.get(f"{BASE_URL}/api/paperwork/products")
        assert response.status_code == 200
        
        data = response.json()
        assert "products" in data
        assert "total" in data
        
        # Verify we have 14 products as expected
        products = data["products"]
        assert len(products) >= 14, f"Expected at least 14 products, got {len(products)}"
        
        # Verify product structure
        if products:
            product = products[0]
            assert "id" in product
            assert "name" in product
            assert "price" in product
            assert "category" in product
            assert product["category"] == "paperwork"
    
    def test_products_have_required_fields(self):
        """Test that products have all required fields"""
        response = requests.get(f"{BASE_URL}/api/paperwork/products")
        assert response.status_code == 200
        
        products = response.json()["products"]
        required_fields = ["id", "name", "description", "price", "category", "product_type"]
        
        for product in products[:5]:  # Check first 5 products
            for field in required_fields:
                assert field in product, f"Product missing field: {field}"
    
    def test_products_have_paw_reward_points(self):
        """Test that products have paw reward points"""
        response = requests.get(f"{BASE_URL}/api/paperwork/products")
        assert response.status_code == 200
        
        products = response.json()["products"]
        products_with_points = [p for p in products if p.get("paw_reward_points", 0) > 0]
        assert len(products_with_points) > 0, "No products have paw reward points"


class TestPaperworkBundles:
    """Test /api/paperwork/bundles endpoint"""
    
    def test_get_bundles_success(self):
        """Test getting paperwork bundles"""
        response = requests.get(f"{BASE_URL}/api/paperwork/bundles")
        assert response.status_code == 200
        
        data = response.json()
        assert "bundles" in data
        assert "total" in data
        
        # Verify we have 5 bundles as expected
        bundles = data["bundles"]
        assert len(bundles) >= 5, f"Expected at least 5 bundles, got {len(bundles)}"
    
    def test_bundles_have_required_fields(self):
        """Test that bundles have all required fields"""
        response = requests.get(f"{BASE_URL}/api/paperwork/bundles")
        assert response.status_code == 200
        
        bundles = response.json()["bundles"]
        required_fields = ["id", "name", "description", "price", "original_price", "items"]
        
        for bundle in bundles:
            for field in required_fields:
                assert field in bundle, f"Bundle missing field: {field}"
    
    def test_bundles_have_savings(self):
        """Test that bundles offer savings (price < original_price)"""
        response = requests.get(f"{BASE_URL}/api/paperwork/bundles")
        assert response.status_code == 200
        
        bundles = response.json()["bundles"]
        for bundle in bundles:
            assert bundle["price"] < bundle["original_price"], f"Bundle {bundle['name']} doesn't offer savings"
    
    def test_specific_bundles_exist(self):
        """Test that specific expected bundles exist"""
        response = requests.get(f"{BASE_URL}/api/paperwork/bundles")
        assert response.status_code == 200
        
        bundles = response.json()["bundles"]
        bundle_names = [b["name"] for b in bundles]
        
        expected_bundles = [
            "Paw Papers Starter Pack",
            "Travel Ready Pack",
            "Emergency & Lost Pet Pack",
            "Lifetime Health File",
            "Digital Document Suite"
        ]
        
        for expected in expected_bundles:
            assert expected in bundle_names, f"Expected bundle '{expected}' not found"


class TestPaperworkCategories:
    """Test /api/paperwork/categories endpoint"""
    
    def test_get_categories_success(self):
        """Test getting document categories"""
        response = requests.get(f"{BASE_URL}/api/paperwork/categories")
        assert response.status_code == 200
        
        data = response.json()
        assert "categories" in data
        assert "reminder_channels" in data
    
    def test_six_categories_exist(self):
        """Test that all 6 document categories exist"""
        response = requests.get(f"{BASE_URL}/api/paperwork/categories")
        assert response.status_code == 200
        
        categories = response.json()["categories"]
        expected_categories = ["identity", "medical", "travel", "insurance", "care", "legal"]
        
        for cat in expected_categories:
            assert cat in categories, f"Category '{cat}' not found"
    
    def test_categories_have_subcategories(self):
        """Test that categories have subcategories"""
        response = requests.get(f"{BASE_URL}/api/paperwork/categories")
        assert response.status_code == 200
        
        categories = response.json()["categories"]
        
        for cat_id, cat_data in categories.items():
            assert "name" in cat_data
            assert "icon" in cat_data
            assert "color" in cat_data
            assert "subcategories" in cat_data
            assert len(cat_data["subcategories"]) > 0, f"Category {cat_id} has no subcategories"
    
    def test_reminder_channels(self):
        """Test that reminder channels are defined"""
        response = requests.get(f"{BASE_URL}/api/paperwork/categories")
        assert response.status_code == 200
        
        channels = response.json()["reminder_channels"]
        expected_channels = ["email", "whatsapp", "both", "app"]
        
        for channel in expected_channels:
            assert channel in channels, f"Reminder channel '{channel}' not found"


class TestPaperworkAdminStats:
    """Test /api/paperwork/admin/stats endpoint"""
    
    def test_get_admin_stats_success(self):
        """Test getting admin statistics"""
        response = requests.get(f"{BASE_URL}/api/paperwork/admin/stats")
        assert response.status_code == 200
        
        data = response.json()
        
        # Verify all expected fields
        expected_fields = [
            "total_documents",
            "total_requests",
            "pending_requests",
            "pending_reminders",
            "by_category",
            "total_products",
            "total_bundles",
            "pets_with_documents"
        ]
        
        for field in expected_fields:
            assert field in data, f"Stats missing field: {field}"
    
    def test_stats_product_bundle_counts(self):
        """Test that stats show correct product and bundle counts"""
        response = requests.get(f"{BASE_URL}/api/paperwork/admin/stats")
        assert response.status_code == 200
        
        data = response.json()
        assert data["total_products"] >= 14, f"Expected at least 14 products, got {data['total_products']}"
        assert data["total_bundles"] >= 5, f"Expected at least 5 bundles, got {data['total_bundles']}"
    
    def test_stats_by_category(self):
        """Test that stats include breakdown by category"""
        response = requests.get(f"{BASE_URL}/api/paperwork/admin/stats")
        assert response.status_code == 200
        
        by_category = response.json()["by_category"]
        expected_categories = ["identity", "medical", "travel", "insurance", "care", "legal"]
        
        for cat in expected_categories:
            assert cat in by_category, f"Category '{cat}' not in stats breakdown"


class TestPaperworkAdminSettings:
    """Test /api/paperwork/admin/settings endpoint"""
    
    def test_get_admin_settings_success(self):
        """Test getting admin settings"""
        response = requests.get(f"{BASE_URL}/api/paperwork/admin/settings")
        assert response.status_code == 200
        
        data = response.json()
        
        # Verify settings structure
        expected_sections = ["paw_rewards", "birthday_perks", "reminders", "notifications", "service_desk", "quick_access"]
        
        for section in expected_sections:
            assert section in data, f"Settings missing section: {section}"
    
    def test_paw_rewards_settings(self):
        """Test paw rewards settings structure"""
        response = requests.get(f"{BASE_URL}/api/paperwork/admin/settings")
        assert response.status_code == 200
        
        paw_rewards = response.json()["paw_rewards"]
        assert "enabled" in paw_rewards
        assert "points_per_document_upload" in paw_rewards
    
    def test_quick_access_settings(self):
        """Test quick access settings for Mira/Concierge"""
        response = requests.get(f"{BASE_URL}/api/paperwork/admin/settings")
        assert response.status_code == 200
        
        quick_access = response.json()["quick_access"]
        assert "enabled_for_mira" in quick_access
        assert "enabled_for_concierge" in quick_access


class TestPaperworkConfig:
    """Test /api/paperwork/config endpoint"""
    
    def test_get_config_success(self):
        """Test getting paperwork config"""
        response = requests.get(f"{BASE_URL}/api/paperwork/config")
        assert response.status_code == 200
        
        data = response.json()
        assert "categories" in data
        assert "reminder_channels" in data
        assert "enabled" in data
        assert data["enabled"] == True


class TestPaperworkRequests:
    """Test /api/paperwork/requests endpoint"""
    
    def test_get_requests_success(self):
        """Test getting paperwork requests"""
        response = requests.get(f"{BASE_URL}/api/paperwork/requests")
        assert response.status_code == 200
        
        data = response.json()
        assert "requests" in data
        assert "total" in data


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
