"""
Backend Tests for Concierge Hours Configuration API
Tests GET and PUT endpoints for /api/os/concierge/admin/hours
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://pillar-launch.preview.emergentagent.com').rstrip('/')


class TestConciergeHoursAPI:
    """Tests for Concierge Hours configuration endpoints"""
    
    def test_get_concierge_hours_returns_200(self):
        """GET /api/os/concierge/admin/hours returns current hours config"""
        response = requests.get(f"{BASE_URL}/api/os/concierge/admin/hours")
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "hours" in data
        assert "current_status" in data
        assert "presets" in data
        
        # Verify hours fields
        hours = data["hours"]
        assert "start" in hours
        assert "end" in hours
        assert "timezone_offset" in hours
        assert "timezone_name" in hours
        assert "is_24x7" in hours
        assert "offline_message" in hours
        
        # Verify status fields
        status = data["current_status"]
        assert "is_live" in status
        assert "status_text" in status
        
        print(f"✓ GET /api/os/concierge/admin/hours returned: hours={hours['start']}-{hours['end']}, is_live={status['is_live']}")
    
    def test_put_concierge_hours_updates_config(self):
        """PUT /api/os/concierge/admin/hours saves new configuration"""
        # Test data
        test_config = {
            "start": 8,
            "end": 20,
            "timezone_offset": 5.5,
            "timezone_name": "IST",
            "is_24x7": False,
            "weekend_hours": None,
            "offline_message": "TEST: Concierge is offline. Please leave a message."
        }
        
        response = requests.put(
            f"{BASE_URL}/api/os/concierge/admin/hours",
            json=test_config,
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify success response
        assert data.get("success") == True
        assert "message" in data
        assert "hours" in data
        assert "current_status" in data
        
        # Verify saved values
        saved_hours = data["hours"]
        assert saved_hours["start"] == test_config["start"]
        assert saved_hours["end"] == test_config["end"]
        assert saved_hours["timezone_name"] == test_config["timezone_name"]
        assert saved_hours["is_24x7"] == test_config["is_24x7"]
        assert saved_hours["offline_message"] == test_config["offline_message"]
        
        print(f"✓ PUT /api/os/concierge/admin/hours saved config: {test_config['start']}-{test_config['end']}")
    
    def test_put_concierge_hours_24x7_mode(self):
        """PUT /api/os/concierge/admin/hours with 24/7 mode enabled"""
        test_config = {
            "start": 0,
            "end": 23,  # Valid end hour (0-23)
            "timezone_offset": 5.5,
            "timezone_name": "IST",
            "is_24x7": True,
            "weekend_hours": None,
            "offline_message": "We are available 24/7!"
        }
        
        response = requests.put(
            f"{BASE_URL}/api/os/concierge/admin/hours",
            json=test_config,
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify 24/7 mode
        assert data.get("success") == True
        assert data["hours"]["is_24x7"] == True
        
        # When 24/7 mode is enabled, status should always be live
        status = data["current_status"]
        assert status["is_live"] == True
        assert status["status_text"] == "Live now"
        
        print(f"✓ 24/7 mode enabled, status is_live={status['is_live']}")
        
        # Restore to non-24/7 mode
        restore_config = {
            "start": 9,
            "end": 21,
            "timezone_offset": 5.5,
            "timezone_name": "IST",
            "is_24x7": False,
            "offline_message": "Leave a message and we'll respond when we're back"
        }
        requests.put(
            f"{BASE_URL}/api/os/concierge/admin/hours",
            json=restore_config,
            headers={"Content-Type": "application/json"}
        )
    
    def test_get_hours_after_update(self):
        """Verify GET returns updated values after PUT"""
        # First, set known values
        update_config = {
            "start": 10,
            "end": 22,
            "timezone_offset": 5.5,
            "timezone_name": "IST",
            "is_24x7": False,
            "offline_message": "TEST verification message"
        }
        
        put_response = requests.put(
            f"{BASE_URL}/api/os/concierge/admin/hours",
            json=update_config,
            headers={"Content-Type": "application/json"}
        )
        assert put_response.status_code == 200
        
        # Now GET and verify
        get_response = requests.get(f"{BASE_URL}/api/os/concierge/admin/hours")
        assert get_response.status_code == 200
        
        data = get_response.json()
        hours = data["hours"]
        
        assert hours["start"] == update_config["start"]
        assert hours["end"] == update_config["end"]
        assert hours["offline_message"] == update_config["offline_message"]
        
        print(f"✓ GET after PUT verified: start={hours['start']}, end={hours['end']}")
        
        # Restore original values
        restore_config = {
            "start": 9,
            "end": 21,
            "timezone_offset": 5.5,
            "timezone_name": "IST",
            "is_24x7": False,
            "offline_message": "Leave a message and we'll respond when we're back"
        }
        requests.put(
            f"{BASE_URL}/api/os/concierge/admin/hours",
            json=restore_config,
            headers={"Content-Type": "application/json"}
        )
    
    def test_concierge_status_endpoint(self):
        """GET /api/os/concierge/status returns live status"""
        response = requests.get(f"{BASE_URL}/api/os/concierge/status")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("success") == True
        assert "is_live" in data
        assert "status_text" in data
        assert "message" in data
        
        print(f"✓ GET /api/os/concierge/status: is_live={data['is_live']}, status_text={data['status_text']}")


class TestConciergeHoursValidation:
    """Tests for Concierge Hours input validation"""
    
    def test_invalid_start_hour_rejected(self):
        """PUT with invalid start hour (>23) should fail"""
        invalid_config = {
            "start": 25,  # Invalid
            "end": 21,
            "timezone_offset": 5.5,
            "timezone_name": "IST",
            "is_24x7": False,
            "offline_message": "Test"
        }
        
        response = requests.put(
            f"{BASE_URL}/api/os/concierge/admin/hours",
            json=invalid_config,
            headers={"Content-Type": "application/json"}
        )
        
        # Should return 422 validation error
        assert response.status_code == 422
        print("✓ Invalid start hour (25) correctly rejected with 422")
    
    def test_invalid_end_hour_rejected(self):
        """PUT with invalid end hour (<0) should fail"""
        invalid_config = {
            "start": 9,
            "end": -1,  # Invalid
            "timezone_offset": 5.5,
            "timezone_name": "IST",
            "is_24x7": False,
            "offline_message": "Test"
        }
        
        response = requests.put(
            f"{BASE_URL}/api/os/concierge/admin/hours",
            json=invalid_config,
            headers={"Content-Type": "application/json"}
        )
        
        # Should return 422 validation error
        assert response.status_code == 422
        print("✓ Invalid end hour (-1) correctly rejected with 422")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
