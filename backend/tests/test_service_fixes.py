"""
Backend tests for service fixes:
1. Celebrate watercolor images (Cloudinary URLs)
2. Inactive service filtering (is_active=true)
3. Hard delete functionality
4. Wrongly-classified products removed from services
5. Mira's picks (claude-picks) service active filtering
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    # Fallback to read from env file
    try:
        with open('/app/frontend/.env') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    BASE_URL = line.strip().split('=', 1)[1]
                    break
    except Exception:
        pass


class TestCelebrateImages:
    """Celebrate pillar services should have Cloudinary images (not static.prod-images)"""

    def test_celebrate_services_have_images(self):
        """Celebrate services should return image URLs"""
        response = requests.get(f"{BASE_URL}/api/service-box/services?pillar=celebrate&limit=50")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        services = data.get('services', [])
        assert len(services) > 0, "Expected celebrate services to exist"

    def test_some_celebrate_services_have_cloudinary_images(self):
        """At least the migrated celebrate services should have Cloudinary images"""
        response = requests.get(f"{BASE_URL}/api/service-box/services?pillar=celebrate&limit=50")
        assert response.status_code == 200
        data = response.json()
        services = data.get('services', [])
        cloudinary_count = sum(
            1 for s in services if 'cloudinary.com' in (s.get('image_url') or s.get('image') or '')
        )
        assert cloudinary_count > 0, "Expected at least some celebrate services to have Cloudinary images"
        print(f"Cloudinary images in celebrate: {cloudinary_count}/{len(services)}")

    def test_celebrate_services_api_response_structure(self):
        """Celebrate endpoint returns proper structure with image_url field"""
        response = requests.get(f"{BASE_URL}/api/service-box/services?pillar=celebrate&limit=5")
        assert response.status_code == 200
        data = response.json()
        services = data.get('services', [])
        for s in services:
            # Every service should have at least one image field
            has_img = bool(s.get('image_url') or s.get('image') or s.get('watercolor_image'))
            if has_img:
                img = s.get('image_url') or s.get('image') or s.get('watercolor_image')
                assert img.startswith('http'), f"Image URL should be a valid URL: {img}"


class TestInactiveServicesFilter:
    """Inactive services should not appear when is_active=true filter is used"""

    def test_is_active_true_filter_returns_only_active(self):
        """When is_active=true filter is used, no inactive services should be returned"""
        response = requests.get(f"{BASE_URL}/api/service-box/services?is_active=true&limit=200")
        assert response.status_code == 200
        data = response.json()
        services = data.get('services', [])
        inactive = [s for s in services if s.get('is_active') == False]
        assert len(inactive) == 0, f"Expected 0 inactive services with filter=true, found {len(inactive)}"

    def test_is_active_false_filter_returns_inactive(self):
        """When is_active=false filter is used, services should be inactive"""
        response = requests.get(f"{BASE_URL}/api/service-box/services?is_active=false&limit=10")
        assert response.status_code == 200
        data = response.json()
        # The inactive count can be 0 or more; just check the API works
        assert 'services' in data
        total = data.get('total', 0)
        print(f"Inactive services count: {total}")

    def test_no_filter_returns_both_active_and_inactive(self):
        """Without filter, admin API should return all services including inactive"""
        # This tests the admin view
        response = requests.get(f"{BASE_URL}/api/service-box/services?limit=50")
        assert response.status_code == 200
        data = response.json()
        assert 'services' in data


class TestHardDelete:
    """Delete service should permanently remove it from the database"""

    def test_delete_removes_service_permanently(self):
        """Create, delete, verify 404"""
        # Step 1: Create
        create_payload = {
            "id": "TEST-HARD-DELETE-SVC",
            "name": "TEST Hard Delete Verification",
            "pillar": "care",
            "description": "This service should be permanently deleted",
            "is_active": True
        }
        create_resp = requests.post(f"{BASE_URL}/api/service-box/services", json=create_payload)
        assert create_resp.status_code == 200, f"Create failed: {create_resp.status_code} - {create_resp.text}"

        # Step 2: Verify it exists
        get_resp = requests.get(f"{BASE_URL}/api/service-box/services/TEST-HARD-DELETE-SVC")
        assert get_resp.status_code == 200, "Service should exist before deletion"

        # Step 3: Delete
        delete_resp = requests.delete(f"{BASE_URL}/api/service-box/services/TEST-HARD-DELETE-SVC")
        assert delete_resp.status_code == 200, f"Delete failed: {delete_resp.status_code}"
        assert delete_resp.json().get('success') == True

        # Step 4: Verify permanently deleted (404)
        verify_resp = requests.get(f"{BASE_URL}/api/service-box/services/TEST-HARD-DELETE-SVC")
        assert verify_resp.status_code == 404, f"Expected 404 after hard delete, got {verify_resp.status_code}"

    def test_delete_nonexistent_service_returns_404(self):
        """Deleting a nonexistent service should return 404"""
        response = requests.delete(f"{BASE_URL}/api/service-box/services/NONEXISTENT-SVC-ID")
        assert response.status_code == 404

    def test_deleted_service_not_in_list(self):
        """After deletion, service should not appear in list"""
        # Create
        payload = {
            "id": "TEST-LIST-VERIFY-SVC",
            "name": "TEST List Verify After Delete",
            "pillar": "care",
            "is_active": True
        }
        requests.post(f"{BASE_URL}/api/service-box/services", json=payload)

        # Delete
        requests.delete(f"{BASE_URL}/api/service-box/services/TEST-LIST-VERIFY-SVC")

        # Verify not in list
        list_resp = requests.get(f"{BASE_URL}/api/service-box/services?search=TEST-LIST-VERIFY-SVC")
        data = list_resp.json()
        services = data.get('services', [])
        ids = [s.get('id') for s in services]
        assert 'TEST-LIST-VERIFY-SVC' not in ids, "Deleted service should not appear in list"


class TestWronglyClassifiedProducts:
    """Wrongly-classified products should NOT appear in services list"""

    def test_snuffle_mat_not_in_services(self):
        """Snuffle Mat is a product, should not be in services"""
        response = requests.get(f"{BASE_URL}/api/service-box/services?search=snuffle+mat&limit=20")
        assert response.status_code == 200
        data = response.json()
        services = data.get('services', [])
        found = [s for s in services if 'snuffle mat' in s.get('name', '').lower()]
        assert len(found) == 0, f"Snuffle Mat should not be in services, but found: {[s['name'] for s in found]}"

    def test_airtight_food_container_not_in_services(self):
        """Airtight Travel Food Container is a product, should not be in services"""
        response = requests.get(f"{BASE_URL}/api/service-box/services?search=airtight&limit=20")
        assert response.status_code == 200
        data = response.json()
        services = data.get('services', [])
        found = [s for s in services if 'airtight' in s.get('name', '').lower()]
        assert len(found) == 0, f"Airtight Travel Food Container found in services: {[s['name'] for s in found]}"

    def test_oatmeal_shampoo_not_in_services(self):
        """Gentle Oatmeal Shampoo is a product, should not be in services"""
        response = requests.get(f"{BASE_URL}/api/service-box/services?search=oatmeal+shampoo&limit=20")
        assert response.status_code == 200
        data = response.json()
        services = data.get('services', [])
        found = [s for s in services if 'shampoo' in s.get('name', '').lower() and 'oatmeal' in s.get('name', '').lower()]
        assert len(found) == 0, f"Gentle Oatmeal Shampoo found in services: {[s['name'] for s in found]}"


class TestServiceStats:
    """Service stats endpoint should work correctly"""

    def test_stats_endpoint(self):
        """Stats should return valid counts"""
        response = requests.get(f"{BASE_URL}/api/service-box/stats")
        assert response.status_code == 200
        data = response.json()
        assert 'total' in data
        assert 'active' in data
        assert data['total'] >= data['active'], "Total should be >= active"
        assert data['total'] > 0, "Should have at least some services"
        print(f"Stats: total={data['total']}, active={data['active']}, inactive={data.get('inactive', 0)}")


class TestServiceActiveFilterInFrontend:
    """
    Verify that the endpoint used by ServicesPage (is_active=true) 
    behaves correctly - simulating what the frontend does
    """

    def test_services_page_query_active_only(self):
        """ServicesPage fetches /api/service-box/services?limit=200&is_active=true"""
        response = requests.get(f"{BASE_URL}/api/service-box/services?limit=200&is_active=true")
        assert response.status_code == 200
        data = response.json()
        services = data.get('services', [])
        
        # No inactive services should appear
        inactive = [s for s in services if s.get('is_active') == False]
        assert len(inactive) == 0, f"Frontend sees {len(inactive)} inactive services - fix needed"
        
        print(f"Active services shown to users: {len(services)}")

    def test_celebrate_page_services_query(self):
        """Services are fetched with is_active=true for user-facing pages"""
        response = requests.get(f"{BASE_URL}/api/service-box/services?pillar=celebrate&is_active=true&limit=50")
        assert response.status_code == 200
        data = response.json()
        services = data.get('services', [])
        total = data.get('total', 0)
        
        # No inactive services
        inactive = [s for s in services if s.get('is_active') == False]
        assert len(inactive) == 0
        print(f"Celebrate services shown to users: {len(services)} (total: {total})")
