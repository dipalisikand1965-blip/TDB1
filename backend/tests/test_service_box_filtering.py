"""
Service Box Filtering Tests
Tests for P0 fix: active_only=True default, inactive service filtering, admin bypass
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
ADMIN_AUTH = ('aditya', 'lola4304')


class TestServiceBoxActiveFiltering:
    """Test the active_only=True default filtering fix"""

    def test_default_request_excludes_inactive(self):
        """GET /api/service-box/services - default should NOT return inactive services"""
        res = requests.get(f"{BASE_URL}/api/service-box/services", auth=ADMIN_AUTH)
        assert res.status_code == 200
        data = res.json()
        services = data.get('services', [])
        inactive_in_response = [s for s in services if s.get('is_active') is False]
        assert len(inactive_in_response) == 0, (
            f"Expected 0 inactive services by default, got {len(inactive_in_response)}. "
            f"Inactive IDs: {[s.get('id') for s in inactive_in_response[:5]]}"
        )
        print(f"PASS: Default request returned {len(services)} services, 0 inactive")

    def test_pillar_adopt_excludes_inactive(self):
        """GET /api/service-box/services?pillar=adopt - should NOT return inactive services"""
        res = requests.get(f"{BASE_URL}/api/service-box/services?pillar=adopt", auth=ADMIN_AUTH)
        assert res.status_code == 200
        data = res.json()
        services = data.get('services', [])
        inactive_in_response = [s for s in services if s.get('is_active') is False]
        assert len(inactive_in_response) == 0, (
            f"Expected 0 inactive services for pillar=adopt, got {len(inactive_in_response)}. "
            f"Inactive IDs: {[s.get('id') for s in inactive_in_response[:5]]}"
        )
        print(f"PASS: pillar=adopt returned {len(services)} services, 0 inactive")

    def test_active_only_false_returns_all(self):
        """GET /api/service-box/services?active_only=false - should return ALL services including inactive"""
        res_all = requests.get(f"{BASE_URL}/api/service-box/services?active_only=false&limit=200", auth=ADMIN_AUTH)
        res_active = requests.get(f"{BASE_URL}/api/service-box/services?limit=200", auth=ADMIN_AUTH)
        assert res_all.status_code == 200
        assert res_active.status_code == 200
        all_services = res_all.json().get('services', [])
        active_services = res_active.json().get('services', [])
        # active_only=false should return >= active_only=true count
        assert len(all_services) >= len(active_services), (
            f"active_only=false returned fewer services ({len(all_services)}) "
            f"than active_only=true ({len(active_services)})"
        )
        print(f"PASS: active_only=false: {len(all_services)} services, active_only=true: {len(active_services)} services")

    def test_is_active_false_returns_only_inactive(self):
        """GET /api/service-box/services?is_active=false - should return ONLY inactive services"""
        res = requests.get(f"{BASE_URL}/api/service-box/services?is_active=false&limit=200", auth=ADMIN_AUTH)
        assert res.status_code == 200
        data = res.json()
        services = data.get('services', [])
        # All returned services should have is_active = False
        active_in_response = [s for s in services if s.get('is_active') is not False]
        total_returned = len(services)
        assert len(active_in_response) == 0, (
            f"is_active=false filter returned {len(active_in_response)} active services "
            f"(should return only inactive). Active IDs: {[s.get('id') for s in active_in_response[:5]]}"
        )
        print(f"PASS: is_active=false returned {total_returned} inactive services, 0 active")

    def test_adopt_pillar_active_only_false(self):
        """GET /api/service-box/services?pillar=adopt&active_only=false - should return ALL including inactive"""
        res = requests.get(
            f"{BASE_URL}/api/service-box/services?pillar=adopt&active_only=false&limit=200",
            auth=ADMIN_AUTH
        )
        assert res.status_code == 200
        data = res.json()
        services = data.get('services', [])
        all_adopt = len(services)
        inactive_count = sum(1 for s in services if s.get('is_active') is False)
        print(f"PASS: pillar=adopt&active_only=false returned {all_adopt} services ({inactive_count} inactive)")
        # Should return more than active-only if there are inactive services
        res_active = requests.get(
            f"{BASE_URL}/api/service-box/services?pillar=adopt&limit=200",
            auth=ADMIN_AUTH
        )
        active_count = len(res_active.json().get('services', []))
        assert all_adopt >= active_count, (
            f"active_only=false ({all_adopt}) should return >= active_only=true ({active_count})"
        )

    def test_service_stats_endpoint(self):
        """GET /api/service-box/stats - should be accessible and return total + active counts"""
        res = requests.get(f"{BASE_URL}/api/service-box/stats", auth=ADMIN_AUTH)
        assert res.status_code == 200
        data = res.json()
        assert 'total' in data
        assert 'active' in data
        assert 'inactive' in data
        # inactive = total - active
        assert data['inactive'] == data['total'] - data['active']
        print(f"PASS: stats: total={data['total']}, active={data['active']}, inactive={data['inactive']}")

    def test_services_response_structure(self):
        """Verify response structure has services, total, pillars"""
        res = requests.get(f"{BASE_URL}/api/service-box/services?limit=10", auth=ADMIN_AUTH)
        assert res.status_code == 200
        data = res.json()
        assert 'services' in data
        assert 'total' in data
        assert 'pillars' in data
        assert isinstance(data['services'], list)
        print(f"PASS: Response structure is valid. total={data['total']}")

    def test_search_param_works(self):
        """GET /api/service-box/services?search=training - should filter services by name/description"""
        res = requests.get(f"{BASE_URL}/api/service-box/services?search=training&limit=50", auth=ADMIN_AUTH)
        assert res.status_code == 200
        data = res.json()
        services = data.get('services', [])
        # All returned should match 'training' in name, description, or id
        for s in services:
            text = ' '.join([
                s.get('name', ''), s.get('description', ''), s.get('id', '')
            ]).lower()
            assert 'training' in text, (
                f"Service '{s.get('id')}' returned for 'training' search but doesn't contain it"
            )
        print(f"PASS: search=training returned {len(services)} matching services")
