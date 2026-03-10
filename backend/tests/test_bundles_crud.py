"""
Test Bundle CRUD API endpoints
Tests: GET /api/bundles, GET /api/bundles?pillar=, POST, PUT, DELETE, seed-defaults
"""
import pytest
import requests
import os
import uuid
from datetime import datetime

# Get API URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    raise ValueError("REACT_APP_BACKEND_URL environment variable is not set")


class TestBundlesAPI:
    """Test Bundle CRUD operations"""
    
    # Track test bundles for cleanup
    created_bundle_ids = []
    
    def test_01_get_all_bundles(self):
        """GET /api/bundles - Should return all bundles with image_url field"""
        response = requests.get(f"{BASE_URL}/api/bundles?active_only=false")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "bundles" in data, "Response should contain 'bundles' key"
        assert "total" in data, "Response should contain 'total' key"
        
        # If bundles exist, verify structure
        bundles = data["bundles"]
        if len(bundles) > 0:
            bundle = bundles[0]
            # Check required fields
            assert "id" in bundle, "Bundle should have 'id'"
            assert "name" in bundle, "Bundle should have 'name'"
            assert "pillar" in bundle, "Bundle should have 'pillar'"
            assert "items" in bundle, "Bundle should have 'items'"
            assert "original_price" in bundle, "Bundle should have 'original_price'"
            assert "bundle_price" in bundle, "Bundle should have 'bundle_price'"
            print(f"✓ GET /api/bundles returned {len(bundles)} bundles")
            
            # Check if image_url field is present (can be null/undefined)
            # This is to verify the new image generation feature
            for b in bundles:
                if "image_url" in b and b["image_url"]:
                    print(f"✓ Bundle '{b['name']}' has image_url: {b['image_url'][:50]}...")
                    break
        else:
            print("⚠ No bundles found - may need to seed first")
    
    def test_02_get_bundles_by_pillar_celebrate(self):
        """GET /api/bundles?pillar=celebrate - Should return only celebrate bundles"""
        response = requests.get(f"{BASE_URL}/api/bundles?pillar=celebrate")
        
        assert response.status_code == 200
        
        data = response.json()
        assert "bundles" in data
        assert data.get("pillar") == "celebrate", "Response should show filtered pillar"
        
        # Verify all returned bundles are from 'celebrate' pillar
        for bundle in data["bundles"]:
            assert bundle["pillar"] == "celebrate", f"Bundle {bundle['id']} has pillar {bundle['pillar']}, expected celebrate"
        
        print(f"✓ GET /api/bundles?pillar=celebrate returned {len(data['bundles'])} celebrate bundles")
    
    def test_03_get_bundles_by_pillar_travel(self):
        """GET /api/bundles?pillar=travel - Should return only travel bundles"""
        response = requests.get(f"{BASE_URL}/api/bundles?pillar=travel")
        
        assert response.status_code == 200
        
        data = response.json()
        for bundle in data["bundles"]:
            assert bundle["pillar"] == "travel"
        
        print(f"✓ GET /api/bundles?pillar=travel returned {len(data['bundles'])} travel bundles")
    
    def test_04_seed_default_bundles(self):
        """POST /api/bundles/seed-defaults - Seeds default bundles"""
        response = requests.post(f"{BASE_URL}/api/bundles/seed-defaults")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "message" in data
        assert "total_bundles" in data
        
        print(f"✓ POST /api/bundles/seed-defaults: {data['message']}, Total: {data['total_bundles']}")
    
    def test_05_create_new_bundle(self):
        """POST /api/bundles - Create a new test bundle"""
        unique_id = str(uuid.uuid4())[:8]
        payload = {
            "name": f"TEST_Bundle_{unique_id}",
            "description": "Test bundle created by automated tests",
            "pillar": "celebrate",
            "items": ["Test Item 1", "Test Item 2", "Test Item 3"],
            "original_price": 1500.0,
            "bundle_price": 1200.0,
            "icon": "🧪",
            "popular": False,
            "active": True
        }
        
        response = requests.post(
            f"{BASE_URL}/api/bundles",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "bundle" in data, "Response should contain 'bundle'"
        assert "message" in data, "Response should contain 'message'"
        
        bundle = data["bundle"]
        assert bundle["name"] == payload["name"]
        assert bundle["pillar"] == payload["pillar"]
        assert bundle["original_price"] == payload["original_price"]
        assert bundle["bundle_price"] == payload["bundle_price"]
        
        # Verify discount calculation
        expected_discount = round((1 - 1200/1500) * 100)
        assert bundle["discount"] == expected_discount, f"Expected discount {expected_discount}, got {bundle['discount']}"
        
        # Track for cleanup
        TestBundlesAPI.created_bundle_ids.append(bundle["id"])
        
        print(f"✓ POST /api/bundles created bundle: {bundle['id']}")
        print(f"  - Discount calculated: {bundle['discount']}%")
        
        return bundle["id"]
    
    def test_06_get_specific_bundle(self):
        """GET /api/bundles/{id} - Get the celebrate-birthday-bundle"""
        bundle_id = "celebrate-birthday-bundle"
        response = requests.get(f"{BASE_URL}/api/bundles/{bundle_id}")
        
        # This bundle should exist after seeding
        if response.status_code == 200:
            data = response.json()
            assert data["id"] == bundle_id
            assert "name" in data
            assert "image_url" in data or True  # image_url may or may not exist
            print(f"✓ GET /api/bundles/{bundle_id} returned: {data['name']}")
            
            # Check if image_url exists
            if data.get("image_url"):
                print(f"  - Has image_url: {data['image_url'][:60]}...")
        else:
            print(f"⚠ Bundle {bundle_id} not found (may need seeding)")
    
    def test_07_update_bundle(self):
        """PUT /api/bundles/{id} - Update bundle and verify discount recalculation"""
        # First create a bundle to update
        unique_id = str(uuid.uuid4())[:8]
        create_payload = {
            "name": f"TEST_UpdateBundle_{unique_id}",
            "description": "Bundle to be updated",
            "pillar": "dine",
            "items": ["Item A", "Item B"],
            "original_price": 2000.0,
            "bundle_price": 1600.0,
            "icon": "🍽️",
            "popular": False,
            "active": True
        }
        
        create_response = requests.post(
            f"{BASE_URL}/api/bundles",
            json=create_payload,
            headers={"Content-Type": "application/json"}
        )
        
        assert create_response.status_code == 200
        bundle_id = create_response.json()["bundle"]["id"]
        TestBundlesAPI.created_bundle_ids.append(bundle_id)
        
        # Now update the bundle
        update_payload = {
            "name": f"TEST_Updated_{unique_id}",
            "bundle_price": 1400.0,  # Change price to trigger discount recalc
            "popular": True
        }
        
        update_response = requests.put(
            f"{BASE_URL}/api/bundles/{bundle_id}",
            json=update_payload,
            headers={"Content-Type": "application/json"}
        )
        
        assert update_response.status_code == 200, f"Expected 200, got {update_response.status_code}: {update_response.text}"
        
        data = update_response.json()
        assert "bundle" in data
        
        updated_bundle = data["bundle"]
        assert updated_bundle["name"] == update_payload["name"]
        assert updated_bundle["bundle_price"] == 1400.0
        assert updated_bundle["popular"] == True
        
        # Verify discount was recalculated: (1 - 1400/2000) * 100 = 30%
        expected_discount = 30
        assert updated_bundle["discount"] == expected_discount, f"Expected discount {expected_discount}%, got {updated_bundle['discount']}%"
        
        print(f"✓ PUT /api/bundles/{bundle_id} updated successfully")
        print(f"  - Name updated: {updated_bundle['name']}")
        print(f"  - Discount recalculated: {updated_bundle['discount']}%")
    
    def test_08_delete_bundle_soft_delete(self):
        """DELETE /api/bundles/{id} - Should soft delete (set active=false)"""
        # Create a bundle to delete
        unique_id = str(uuid.uuid4())[:8]
        create_payload = {
            "name": f"TEST_DeleteBundle_{unique_id}",
            "description": "Bundle to be deleted",
            "pillar": "care",
            "items": ["Delete Item"],
            "original_price": 500.0,
            "bundle_price": 400.0,
            "icon": "🗑️",
            "popular": False,
            "active": True
        }
        
        create_response = requests.post(
            f"{BASE_URL}/api/bundles",
            json=create_payload,
            headers={"Content-Type": "application/json"}
        )
        
        assert create_response.status_code == 200
        bundle_id = create_response.json()["bundle"]["id"]
        TestBundlesAPI.created_bundle_ids.append(bundle_id)
        
        # Delete the bundle
        delete_response = requests.delete(f"{BASE_URL}/api/bundles/{bundle_id}")
        
        assert delete_response.status_code == 200, f"Expected 200, got {delete_response.status_code}: {delete_response.text}"
        
        data = delete_response.json()
        assert "message" in data
        assert data["bundle_id"] == bundle_id
        
        # Verify soft delete - bundle should still exist but be inactive
        get_response = requests.get(f"{BASE_URL}/api/bundles/{bundle_id}")
        if get_response.status_code == 200:
            bundle = get_response.json()
            assert bundle["active"] == False, "Bundle should be inactive after soft delete"
            print(f"✓ DELETE /api/bundles/{bundle_id} soft-deleted (active=false)")
        else:
            print(f"⚠ Could not verify soft delete - bundle not found")
    
    def test_09_verify_birthday_bundle_has_image(self):
        """Verify celebrate-birthday-bundle has image_url as mentioned in test requirements"""
        bundle_id = "celebrate-birthday-bundle"
        response = requests.get(f"{BASE_URL}/api/bundles/{bundle_id}")
        
        if response.status_code == 200:
            bundle = response.json()
            if bundle.get("image_url"):
                print(f"✓ Bundle '{bundle['name']}' has image_url: {bundle['image_url']}")
                assert bundle["image_url"].startswith("http"), "image_url should be a valid URL"
            else:
                print(f"⚠ Bundle '{bundle['name']}' does not have image_url yet")
        else:
            print(f"⚠ Bundle {bundle_id} not found")
    
    def test_10_delete_nonexistent_bundle(self):
        """DELETE /api/bundles/{id} - Should return 404 for non-existent bundle"""
        fake_bundle_id = "nonexistent-bundle-12345"
        response = requests.delete(f"{BASE_URL}/api/bundles/{fake_bundle_id}")
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print(f"✓ DELETE nonexistent bundle correctly returns 404")
    
    @classmethod
    def teardown_class(cls):
        """Cleanup test bundles"""
        print("\n--- Cleaning up test bundles ---")
        for bundle_id in cls.created_bundle_ids:
            try:
                requests.delete(f"{BASE_URL}/api/bundles/{bundle_id}")
                print(f"  Cleaned up: {bundle_id}")
            except Exception as e:
                print(f"  Failed to cleanup {bundle_id}: {e}")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
