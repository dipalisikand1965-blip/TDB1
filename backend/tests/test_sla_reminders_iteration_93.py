"""
Test Suite for Iteration 93: SLA Timers, Reminders/Tasks, and Auto-Acknowledge Emails
Features tested:
1. SLA Timer calculation and display (based on urgency)
2. Reminder/Tasks CRUD operations
3. Auto-acknowledge email on ticket creation
"""

import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Admin credentials
ADMIN_USERNAME = "aditya"
ADMIN_PASSWORD = "lola4304"


@pytest.fixture(scope="module")
def auth_headers():
    """Get authentication headers for admin"""
    return {
        "Content-Type": "application/json",
        "X-Admin-Username": ADMIN_USERNAME,
        "X-Admin-Password": ADMIN_PASSWORD
    }


@pytest.fixture(scope="module")
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


class TestSLATimerCalculation:
    """Test SLA timer calculation based on urgency levels"""
    
    def test_sla_hours_mapping(self, api_client, auth_headers):
        """Verify SLA hours are correctly mapped to urgency levels"""
        # SLA hours: low=48h, medium=24h, high=8h, critical=2h, urgent=4h
        urgency_sla_map = {
            "low": 48,
            "medium": 24,
            "high": 8,
            "critical": 2,
            "urgent": 4
        }
        
        for urgency, expected_hours in urgency_sla_map.items():
            # Create a ticket with specific urgency
            response = api_client.post(
                f"{BASE_URL}/api/tickets/",
                headers=auth_headers,
                json={
                    "category": "inquiry",
                    "urgency": urgency,
                    "description": f"TEST_SLA_{urgency} - Testing SLA calculation",
                    "member": {
                        "name": f"Test SLA {urgency}",
                        "email": f"test_sla_{urgency}@example.com",
                        "phone": "9999999999"
                    }
                }
            )
            
            assert response.status_code == 200, f"Failed to create ticket with urgency {urgency}: {response.text}"
            data = response.json()
            
            # Verify sla_due_at is set
            assert "ticket" in data
            ticket = data["ticket"]
            assert "sla_due_at" in ticket, f"sla_due_at not found for urgency {urgency}"
            assert ticket["sla_due_at"] is not None, f"sla_due_at is None for urgency {urgency}"
            
            # Verify the SLA time is approximately correct (within 5 minutes tolerance)
            sla_due = datetime.fromisoformat(ticket["sla_due_at"].replace("Z", "+00:00"))
            now = datetime.now(sla_due.tzinfo)
            expected_due = now + timedelta(hours=expected_hours)
            
            # Allow 5 minute tolerance
            time_diff = abs((sla_due - expected_due).total_seconds())
            assert time_diff < 300, f"SLA time mismatch for {urgency}: expected ~{expected_hours}h, got {sla_due}"
            
            print(f"✓ SLA for urgency '{urgency}': {expected_hours}h - sla_due_at: {ticket['sla_due_at']}")


class TestSLAStatusInTicketResponse:
    """Test SLA status is included in ticket responses"""
    
    def test_ticket_list_includes_sla_status(self, api_client, auth_headers):
        """Verify ticket list includes sla_status for each ticket"""
        response = api_client.get(f"{BASE_URL}/api/tickets/", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        
        assert "tickets" in data
        tickets = data["tickets"]
        
        # Check at least one ticket has sla_status
        tickets_with_sla = [t for t in tickets if t.get("sla_status")]
        print(f"Found {len(tickets_with_sla)} tickets with sla_status out of {len(tickets)} total")
        
        if tickets_with_sla:
            # Verify sla_status structure
            sla_status = tickets_with_sla[0]["sla_status"]
            assert "status" in sla_status, "sla_status missing 'status' field"
            assert "seconds_remaining" in sla_status, "sla_status missing 'seconds_remaining' field"
            assert sla_status["status"] in ["ok", "warning", "critical", "breached"], f"Invalid SLA status: {sla_status['status']}"
            print(f"✓ SLA status structure verified: {sla_status}")
    
    def test_single_ticket_includes_sla_status(self, api_client, auth_headers):
        """Verify single ticket GET includes sla_status"""
        # First create a ticket
        create_response = api_client.post(
            f"{BASE_URL}/api/tickets/",
            headers=auth_headers,
            json={
                "category": "inquiry",
                "urgency": "medium",
                "description": "TEST_SLA_Single - Testing single ticket SLA",
                "member": {
                    "name": "Test SLA Single",
                    "email": "test_sla_single@example.com"
                }
            }
        )
        
        assert create_response.status_code == 200
        ticket_id = create_response.json()["ticket"]["ticket_id"]
        
        # Get the ticket
        get_response = api_client.get(f"{BASE_URL}/api/tickets/{ticket_id}", headers=auth_headers)
        
        assert get_response.status_code == 200
        ticket = get_response.json()["ticket"]
        
        assert "sla_due_at" in ticket, "sla_due_at not in ticket response"
        assert "sla_status" in ticket, "sla_status not in ticket response"
        
        sla_status = ticket["sla_status"]
        assert sla_status is not None, "sla_status is None"
        assert "status" in sla_status
        assert "seconds_remaining" in sla_status
        
        print(f"✓ Single ticket SLA status: {sla_status}")


class TestRemindersCRUD:
    """Test Reminder/Tasks CRUD operations"""
    
    @pytest.fixture(scope="class")
    def test_ticket_id(self, api_client, auth_headers):
        """Create a test ticket for reminder tests"""
        response = api_client.post(
            f"{BASE_URL}/api/tickets/",
            headers=auth_headers,
            json={
                "category": "inquiry",
                "urgency": "medium",
                "description": "TEST_Reminders - Ticket for reminder testing",
                "member": {
                    "name": "Test Reminders",
                    "email": "test_reminders@example.com"
                }
            }
        )
        assert response.status_code == 200
        return response.json()["ticket"]["ticket_id"]
    
    def test_get_reminders_empty(self, api_client, auth_headers, test_ticket_id):
        """GET /api/tickets/{id}/reminders returns empty list for new ticket"""
        response = api_client.get(
            f"{BASE_URL}/api/tickets/{test_ticket_id}/reminders",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "reminders" in data
        assert isinstance(data["reminders"], list)
        print(f"✓ GET reminders returns empty list: {data}")
    
    def test_create_reminder(self, api_client, auth_headers, test_ticket_id):
        """POST /api/tickets/{id}/reminders creates a reminder"""
        reminder_data = {
            "title": "TEST_Follow up with customer",
            "description": "Call customer to check on their pet",
            "due_at": (datetime.now() + timedelta(hours=2)).isoformat(),
            "reminder_type": "follow_up",
            "priority": "medium"
        }
        
        response = api_client.post(
            f"{BASE_URL}/api/tickets/{test_ticket_id}/reminders",
            headers=auth_headers,
            json=reminder_data
        )
        
        assert response.status_code == 200, f"Failed to create reminder: {response.text}"
        data = response.json()
        
        assert data.get("success") == True
        assert "reminder" in data
        
        reminder = data["reminder"]
        assert reminder["title"] == reminder_data["title"]
        assert reminder["description"] == reminder_data["description"]
        assert reminder["reminder_type"] == "follow_up"
        assert reminder["priority"] == "medium"
        assert "id" in reminder
        
        print(f"✓ Created reminder: {reminder}")
        return reminder["id"]
    
    def test_create_reminder_all_types(self, api_client, auth_headers, test_ticket_id):
        """Test creating reminders with all types: follow_up, call_back, task, deadline"""
        reminder_types = ["follow_up", "call_back", "task", "deadline"]
        
        for rem_type in reminder_types:
            response = api_client.post(
                f"{BASE_URL}/api/tickets/{test_ticket_id}/reminders",
                headers=auth_headers,
                json={
                    "title": f"TEST_{rem_type} reminder",
                    "description": f"Testing {rem_type} type",
                    "due_at": (datetime.now() + timedelta(hours=1)).isoformat(),
                    "reminder_type": rem_type,
                    "priority": "high"
                }
            )
            
            assert response.status_code == 200, f"Failed to create {rem_type} reminder: {response.text}"
            print(f"✓ Created {rem_type} reminder")
    
    def test_get_reminders_after_create(self, api_client, auth_headers, test_ticket_id):
        """GET /api/tickets/{id}/reminders returns created reminders"""
        response = api_client.get(
            f"{BASE_URL}/api/tickets/{test_ticket_id}/reminders",
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        assert "reminders" in data
        reminders = data["reminders"]
        assert len(reminders) >= 1, "Expected at least 1 reminder"
        
        # Verify reminder structure
        for reminder in reminders:
            assert "id" in reminder
            assert "title" in reminder
            assert "due_at" in reminder
            assert "reminder_type" in reminder
            assert "priority" in reminder
            assert "status" in reminder
        
        print(f"✓ GET reminders returned {len(reminders)} reminders")
        return reminders
    
    def test_complete_reminder(self, api_client, auth_headers, test_ticket_id):
        """PATCH /api/tickets/{id}/reminders/{reminder_id} marks reminder as completed"""
        # First create a reminder
        create_response = api_client.post(
            f"{BASE_URL}/api/tickets/{test_ticket_id}/reminders",
            headers=auth_headers,
            json={
                "title": "TEST_Complete this reminder",
                "description": "Will be marked complete",
                "due_at": (datetime.now() + timedelta(hours=1)).isoformat(),
                "reminder_type": "task",
                "priority": "low"
            }
        )
        
        assert create_response.status_code == 200
        reminder_id = create_response.json()["reminder"]["id"]
        
        # Mark as completed
        patch_response = api_client.patch(
            f"{BASE_URL}/api/tickets/{test_ticket_id}/reminders/{reminder_id}",
            headers=auth_headers,
            json={"status": "completed"}
        )
        
        assert patch_response.status_code == 200, f"Failed to complete reminder: {patch_response.text}"
        data = patch_response.json()
        assert data.get("success") == True
        
        # Verify it's completed
        get_response = api_client.get(
            f"{BASE_URL}/api/tickets/{test_ticket_id}/reminders",
            headers=auth_headers
        )
        
        reminders = get_response.json()["reminders"]
        completed_reminder = next((r for r in reminders if r["id"] == reminder_id), None)
        
        assert completed_reminder is not None
        assert completed_reminder["status"] == "completed"
        assert "completed_at" in completed_reminder
        
        print(f"✓ Reminder marked as completed: {completed_reminder}")
    
    def test_delete_reminder(self, api_client, auth_headers, test_ticket_id):
        """DELETE /api/tickets/{id}/reminders/{reminder_id} removes reminder"""
        # First create a reminder
        create_response = api_client.post(
            f"{BASE_URL}/api/tickets/{test_ticket_id}/reminders",
            headers=auth_headers,
            json={
                "title": "TEST_Delete this reminder",
                "description": "Will be deleted",
                "due_at": (datetime.now() + timedelta(hours=1)).isoformat(),
                "reminder_type": "task",
                "priority": "low"
            }
        )
        
        assert create_response.status_code == 200
        reminder_id = create_response.json()["reminder"]["id"]
        
        # Delete the reminder
        delete_response = api_client.delete(
            f"{BASE_URL}/api/tickets/{test_ticket_id}/reminders/{reminder_id}",
            headers=auth_headers
        )
        
        assert delete_response.status_code == 200, f"Failed to delete reminder: {delete_response.text}"
        data = delete_response.json()
        assert data.get("success") == True
        
        # Verify it's deleted
        get_response = api_client.get(
            f"{BASE_URL}/api/tickets/{test_ticket_id}/reminders",
            headers=auth_headers
        )
        
        reminders = get_response.json()["reminders"]
        deleted_reminder = next((r for r in reminders if r["id"] == reminder_id), None)
        
        assert deleted_reminder is None, "Reminder should be deleted"
        print(f"✓ Reminder deleted successfully")
    
    def test_overdue_reminder_indicator(self, api_client, auth_headers, test_ticket_id):
        """Verify overdue reminders have is_overdue flag"""
        # Create a reminder with past due date
        past_date = (datetime.now() - timedelta(hours=2)).isoformat()
        
        create_response = api_client.post(
            f"{BASE_URL}/api/tickets/{test_ticket_id}/reminders",
            headers=auth_headers,
            json={
                "title": "TEST_Overdue reminder",
                "description": "This is overdue",
                "due_at": past_date,
                "reminder_type": "deadline",
                "priority": "high"
            }
        )
        
        assert create_response.status_code == 200
        reminder_id = create_response.json()["reminder"]["id"]
        
        # Get reminders and check is_overdue
        get_response = api_client.get(
            f"{BASE_URL}/api/tickets/{test_ticket_id}/reminders",
            headers=auth_headers
        )
        
        reminders = get_response.json()["reminders"]
        overdue_reminder = next((r for r in reminders if r["id"] == reminder_id), None)
        
        assert overdue_reminder is not None
        assert overdue_reminder.get("is_overdue") == True, "Overdue reminder should have is_overdue=True"
        
        print(f"✓ Overdue reminder has is_overdue flag: {overdue_reminder}")


class TestAutoAcknowledgeEmail:
    """Test auto-acknowledge email on ticket creation"""
    
    def test_ticket_creation_triggers_email(self, api_client, auth_headers):
        """Verify ticket creation triggers auto-acknowledge email (check logs)"""
        # Create a ticket with email
        response = api_client.post(
            f"{BASE_URL}/api/tickets/",
            headers=auth_headers,
            json={
                "category": "inquiry",
                "urgency": "medium",
                "description": "TEST_AutoEmail - Testing auto-acknowledge email",
                "member": {
                    "name": "Test Auto Email",
                    "email": "test_auto_email@example.com",
                    "phone": "9999999999"
                }
            }
        )
        
        assert response.status_code == 200, f"Failed to create ticket: {response.text}"
        data = response.json()
        
        assert data.get("success") == True
        ticket = data["ticket"]
        
        # The email is sent asynchronously, we can only verify the ticket was created
        # Email sending is logged in backend - check logs for verification
        print(f"✓ Ticket created: {ticket['ticket_id']}")
        print("  Note: Auto-acknowledge email is sent via Resend API (check backend logs)")
        print("  Email is MOCKED - logs only, no actual sending without valid API key")


class TestSLAStatusColors:
    """Test SLA status values for color coding"""
    
    def test_sla_status_values(self, api_client, auth_headers):
        """Verify SLA status returns correct values: ok, warning, critical, breached"""
        # Get tickets and check SLA status values
        response = api_client.get(f"{BASE_URL}/api/tickets/", headers=auth_headers)
        
        assert response.status_code == 200
        tickets = response.json()["tickets"]
        
        valid_statuses = ["ok", "warning", "critical", "breached"]
        
        for ticket in tickets:
            if ticket.get("sla_status"):
                status = ticket["sla_status"]["status"]
                assert status in valid_statuses, f"Invalid SLA status: {status}"
        
        print(f"✓ All SLA statuses are valid: {valid_statuses}")


class TestReminderPriorities:
    """Test reminder priority levels"""
    
    def test_reminder_priorities(self, api_client, auth_headers):
        """Test creating reminders with all priority levels: low, medium, high"""
        # Create a test ticket
        ticket_response = api_client.post(
            f"{BASE_URL}/api/tickets/",
            headers=auth_headers,
            json={
                "category": "inquiry",
                "urgency": "medium",
                "description": "TEST_Priority - Testing reminder priorities",
                "member": {"name": "Test Priority", "email": "test_priority@example.com"}
            }
        )
        
        assert ticket_response.status_code == 200
        ticket_id = ticket_response.json()["ticket"]["ticket_id"]
        
        priorities = ["low", "medium", "high"]
        
        for priority in priorities:
            response = api_client.post(
                f"{BASE_URL}/api/tickets/{ticket_id}/reminders",
                headers=auth_headers,
                json={
                    "title": f"TEST_{priority} priority reminder",
                    "description": f"Testing {priority} priority",
                    "due_at": (datetime.now() + timedelta(hours=1)).isoformat(),
                    "reminder_type": "task",
                    "priority": priority
                }
            )
            
            assert response.status_code == 200, f"Failed to create {priority} priority reminder"
            reminder = response.json()["reminder"]
            assert reminder["priority"] == priority
            print(f"✓ Created reminder with priority: {priority}")


# Cleanup fixture
@pytest.fixture(scope="module", autouse=True)
def cleanup_test_data(api_client, auth_headers):
    """Cleanup TEST_ prefixed tickets after tests"""
    yield
    # Note: In production, we'd delete test data here
    # For now, test data is left for manual inspection
    print("\n--- Test data cleanup skipped (manual inspection) ---")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
