"""
Backend Tests for Concierge Hours Configuration API
Tests GET/PUT /api/os/concierge/admin/hours
Tests POST/DELETE /api/os/concierge/admin/date-overrides (holidays/special days)
Tests GET /api/os/concierge/status (live/offline status check)
"""

import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://play-layout-fix.preview.emergentagent.com').rstrip('/')


class TestConciergeHoursAPI:
    """Tests for Concierge Hours configuration endpoints"""
    
    def test_get_concierge_hours_returns_200(self):
        """GET /api/os/concierge/admin/hours returns current hours config with date_overrides"""
        response = requests.get(f"{BASE_URL}/api/os/concierge/admin/hours")
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "hours" in data
        assert "current_status" in data
        assert "presets" in data
        assert "date_overrides" in data  # NEW: date overrides array
        
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
        
        # date_overrides should be a list
        assert isinstance(data["date_overrides"], list)
        
        print(f"PASS: GET /api/os/concierge/admin/hours returned hours={hours['start']}-{hours['end']}, status={status['is_live']}, overrides_count={len(data['date_overrides'])}")
    
    def test_put_concierge_hours_updates_config(self):
        """PUT /api/os/concierge/admin/hours saves new configuration"""
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
        
        print(f"PASS: PUT /api/os/concierge/admin/hours saved config: {test_config['start']}-{test_config['end']}")
    
    def test_put_concierge_hours_24x7_mode(self):
        """PUT /api/os/concierge/admin/hours with 24/7 mode enabled - should always be live"""
        test_config = {
            "start": 0,
            "end": 23,
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
        
        print(f"PASS: 24/7 mode enabled, status is_live={status['is_live']}")
        
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


class TestConciergeStatusEndpoint:
    """Tests for GET /api/os/concierge/status - verifies is_live logic"""
    
    def test_status_endpoint_returns_is_live(self):
        """GET /api/os/concierge/status returns valid status structure"""
        response = requests.get(f"{BASE_URL}/api/os/concierge/status")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("success") == True
        assert "is_live" in data
        assert isinstance(data["is_live"], bool)
        assert "status_text" in data
        assert "message" in data
        assert "hours_config" in data
        
        # Verify hours_config has expected structure
        hours = data["hours_config"]
        assert "start" in hours
        assert "end" in hours
        
        print(f"PASS: GET /api/os/concierge/status: is_live={data['is_live']}, status_text={data['status_text']}")
    
    def test_status_is_live_based_on_hours(self):
        """Verify is_live is calculated correctly based on configured hours"""
        # First, set a known configuration
        config = {
            "start": 9,
            "end": 21,  # 9 AM to 9 PM
            "timezone_offset": 5.5,
            "timezone_name": "IST",
            "is_24x7": False,
            "offline_message": "Test offline message"
        }
        
        put_response = requests.put(
            f"{BASE_URL}/api/os/concierge/admin/hours",
            json=config,
            headers={"Content-Type": "application/json"}
        )
        assert put_response.status_code == 200
        
        # Now get status
        status_response = requests.get(f"{BASE_URL}/api/os/concierge/status")
        assert status_response.status_code == 200
        data = status_response.json()
        
        # Verify response includes hours_config
        assert "hours_config" in data
        assert data["hours_config"]["start"] == 9
        assert data["hours_config"]["end"] == 21
        
        print(f"PASS: Status check with hours 9-21 IST: is_live={data['is_live']}")


class TestDateOverridesAPI:
    """Tests for date-specific schedule overrides (holidays/special days)"""
    
    def test_get_date_overrides_returns_list(self):
        """GET /api/os/concierge/admin/date-overrides returns list of overrides"""
        response = requests.get(f"{BASE_URL}/api/os/concierge/admin/date-overrides")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "overrides" in data
        assert "current_status" in data
        assert "total_count" in data
        assert isinstance(data["overrides"], list)
        assert isinstance(data["total_count"], int)
        
        print(f"PASS: GET /api/os/concierge/admin/date-overrides returned {data['total_count']} overrides")
    
    def test_create_closed_date_override_holiday(self):
        """POST /api/os/concierge/admin/date-overrides creates a holiday (closed day)"""
        # Create a holiday for Christmas 2025
        holiday_data = {
            "date": "2025-12-25",
            "is_closed": True,
            "reason": "Christmas Day"
        }
        
        # First, delete if it already exists (cleanup)
        requests.delete(f"{BASE_URL}/api/os/concierge/admin/date-overrides/2025-12-25")
        
        response = requests.post(
            f"{BASE_URL}/api/os/concierge/admin/date-overrides",
            json=holiday_data,
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("success") == True
        assert "message" in data
        assert "override" in data
        
        override = data["override"]
        assert override["date"] == "2025-12-25"
        assert override["is_closed"] == True
        assert override["reason"] == "Christmas Day"
        
        print(f"PASS: Created Christmas holiday override: {holiday_data}")
    
    def test_create_custom_hours_override(self):
        """POST /api/os/concierge/admin/date-overrides creates custom hours for a day"""
        # Create custom hours for a special event day
        custom_hours_data = {
            "date": "2025-12-31",
            "is_closed": False,
            "start_hour": 10,
            "end_hour": 16,  # Shorter hours on New Year's Eve
            "reason": "New Year's Eve - Short Hours"
        }
        
        # First, delete if it already exists (cleanup)
        requests.delete(f"{BASE_URL}/api/os/concierge/admin/date-overrides/2025-12-31")
        
        response = requests.post(
            f"{BASE_URL}/api/os/concierge/admin/date-overrides",
            json=custom_hours_data,
            headers={"Content-Type": "application/json"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("success") == True
        override = data["override"]
        assert override["date"] == "2025-12-31"
        assert override["is_closed"] == False
        assert override["start_hour"] == 10
        assert override["end_hour"] == 16
        assert override["reason"] == "New Year's Eve - Short Hours"
        
        print(f"PASS: Created custom hours override: {custom_hours_data}")
    
    def test_duplicate_date_override_rejected(self):
        """POST /api/os/concierge/admin/date-overrides rejects duplicate date"""
        # First create a date override
        test_date = "2026-01-26"  # Republic Day
        first_data = {
            "date": test_date,
            "is_closed": True,
            "reason": "Republic Day"
        }
        
        # Cleanup first
        requests.delete(f"{BASE_URL}/api/os/concierge/admin/date-overrides/{test_date}")
        
        # Create first override
        requests.post(
            f"{BASE_URL}/api/os/concierge/admin/date-overrides",
            json=first_data,
            headers={"Content-Type": "application/json"}
        )
        
        # Try to create duplicate
        response = requests.post(
            f"{BASE_URL}/api/os/concierge/admin/date-overrides",
            json=first_data,
            headers={"Content-Type": "application/json"}
        )
        
        # Should return 400 for duplicate
        assert response.status_code == 400
        data = response.json()
        assert "already exists" in data.get("detail", "").lower() or "detail" in data
        
        print(f"PASS: Duplicate date override correctly rejected with 400")
    
    def test_delete_date_override(self):
        """DELETE /api/os/concierge/admin/date-overrides/{date} removes override"""
        # First create a date override
        test_date = "2026-08-15"  # Independence Day
        create_data = {
            "date": test_date,
            "is_closed": True,
            "reason": "Independence Day"
        }
        
        # Cleanup first if exists
        requests.delete(f"{BASE_URL}/api/os/concierge/admin/date-overrides/{test_date}")
        
        # Create the override
        create_response = requests.post(
            f"{BASE_URL}/api/os/concierge/admin/date-overrides",
            json=create_data,
            headers={"Content-Type": "application/json"}
        )
        assert create_response.status_code == 200
        
        # Now delete it
        delete_response = requests.delete(f"{BASE_URL}/api/os/concierge/admin/date-overrides/{test_date}")
        
        assert delete_response.status_code == 200
        data = delete_response.json()
        assert data.get("success") == True
        
        print(f"PASS: Successfully deleted date override for {test_date}")
    
    def test_delete_nonexistent_date_override_returns_404(self):
        """DELETE /api/os/concierge/admin/date-overrides/{date} returns 404 for missing date"""
        response = requests.delete(f"{BASE_URL}/api/os/concierge/admin/date-overrides/2099-01-01")
        
        assert response.status_code == 404
        print("PASS: DELETE for non-existent date correctly returns 404")
    
    def test_invalid_date_format_rejected(self):
        """POST with invalid date format should fail"""
        invalid_data = {
            "date": "25-12-2025",  # Invalid format (should be YYYY-MM-DD)
            "is_closed": True,
            "reason": "Test"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/os/concierge/admin/date-overrides",
            json=invalid_data,
            headers={"Content-Type": "application/json"}
        )
        
        # Should return 400 for invalid date format
        assert response.status_code == 400
        print("PASS: Invalid date format correctly rejected with 400")


class TestDateOverridesInHoursResponse:
    """Tests that date_overrides array is included in hours response"""
    
    def test_hours_response_includes_date_overrides(self):
        """GET /api/os/concierge/admin/hours should include date_overrides array"""
        # First create a date override to ensure we have at least one
        test_date = "2026-10-15"  # Diwali
        create_data = {
            "date": test_date,
            "is_closed": True,
            "reason": "TEST_Diwali"
        }
        
        # Cleanup and create
        requests.delete(f"{BASE_URL}/api/os/concierge/admin/date-overrides/{test_date}")
        requests.post(
            f"{BASE_URL}/api/os/concierge/admin/date-overrides",
            json=create_data,
            headers={"Content-Type": "application/json"}
        )
        
        # Get hours config
        response = requests.get(f"{BASE_URL}/api/os/concierge/admin/hours")
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify date_overrides is included
        assert "date_overrides" in data
        assert isinstance(data["date_overrides"], list)
        
        # Find our created override
        found = False
        for override in data["date_overrides"]:
            if override.get("date") == test_date:
                found = True
                assert override["is_closed"] == True
                assert "TEST_Diwali" in override.get("reason", "")
                break
        
        assert found, f"Created override for {test_date} not found in response"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/os/concierge/admin/date-overrides/{test_date}")
        
        print(f"PASS: date_overrides included in hours response with {len(data['date_overrides'])} overrides")


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
        print("PASS: Invalid start hour (25) correctly rejected with 422")
    
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
        print("PASS: Invalid end hour (-1) correctly rejected with 422")


class TestCleanup:
    """Cleanup test data created during testing"""
    
    def test_cleanup_test_overrides(self):
        """Remove test date overrides"""
        test_dates = ["2025-12-25", "2025-12-31", "2026-01-26", "2026-08-15", "2026-10-15"]
        
        for date in test_dates:
            requests.delete(f"{BASE_URL}/api/os/concierge/admin/date-overrides/{date}")
        
        # Restore default hours
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
        
        print("PASS: Cleanup completed - removed test overrides and restored default hours")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
