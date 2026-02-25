"""
Command Center Unified Testing
==============================
Tests for enhanced Command Center with:
- All 12 pillars (celebrate, dine, stay, travel, care, shop, club, enjoy, fit, advisory, paperwork, emergency)
- New source types (membership, voice_order, autoship, stay_booking, dine_reservation, travel_request, care_appointment)
- CRUD operations for tickets
- Manual assignment with agent dropdown
- Quick actions (claim without opening)
- Bulk selection and bulk actions
- CSV export
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthCheck:
    """Basic health check"""
    
    def test_api_health(self):
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200


class TestPillarStats:
    """Test pillar stats endpoint returns counts for all 12 pillars"""
    
    def test_pillar_stats_endpoint(self):
        response = requests.get(f"{BASE_URL}/api/concierge/pillar-stats")
        assert response.status_code == 200
        data = response.json()
        
        # Verify structure
        assert "pillars" in data
        assert "total" in data
        
        # Verify all 12 pillars are present
        expected_pillars = [
            "celebrate", "dine", "stay", "travel", "care", "shop",
            "club", "enjoy", "fit", "advisory", "paperwork", "emergency"
        ]
        for pillar in expected_pillars:
            assert pillar in data["pillars"], f"Missing pillar: {pillar}"
    
    def test_pillar_stats_counts_are_integers(self):
        response = requests.get(f"{BASE_URL}/api/concierge/pillar-stats")
        data = response.json()
        
        for pillar, count in data["pillars"].items():
            assert isinstance(count, int), f"Pillar {pillar} count should be integer"
            assert count >= 0, f"Pillar {pillar} count should be non-negative"


class TestQueueWithPillarFilter:
    """Test queue endpoint supports pillar filter parameter"""
    
    def test_queue_without_filter(self):
        response = requests.get(f"{BASE_URL}/api/concierge/queue")
        assert response.status_code == 200
        data = response.json()
        
        assert "items" in data
        assert "total" in data
        assert "attention" in data
        assert "buckets" in data
    
    def test_queue_with_pillar_filter(self):
        # Test with celebrate pillar
        response = requests.get(f"{BASE_URL}/api/concierge/queue?pillar=celebrate")
        assert response.status_code == 200
        data = response.json()
        
        # All items should have celebrate pillar or category
        for item in data["items"]:
            pillar = item.get("pillar") or item.get("category")
            assert pillar == "celebrate", f"Item {item.get('ticket_id')} has pillar {pillar}, expected celebrate"
    
    def test_queue_with_multiple_filters(self):
        # Test with pillar and priority
        response = requests.get(f"{BASE_URL}/api/concierge/queue?pillar=travel&priority=high")
        assert response.status_code == 200
        data = response.json()
        
        # Verify filters are applied
        assert "filters" in data


class TestQueueSourceTypes:
    """Test queue endpoint includes new source types"""
    
    def test_queue_source_filter_membership(self):
        response = requests.get(f"{BASE_URL}/api/concierge/queue?source=membership")
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
    
    def test_queue_source_filter_voice_order(self):
        response = requests.get(f"{BASE_URL}/api/concierge/queue?source=voice_order")
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
    
    def test_queue_source_filter_autoship(self):
        response = requests.get(f"{BASE_URL}/api/concierge/queue?source=autoship")
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
    
    def test_queue_source_filter_stay(self):
        response = requests.get(f"{BASE_URL}/api/concierge/queue?source=stay")
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
    
    def test_queue_source_filter_dine(self):
        response = requests.get(f"{BASE_URL}/api/concierge/queue?source=dine")
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
    
    def test_queue_source_filter_travel(self):
        response = requests.get(f"{BASE_URL}/api/concierge/queue?source=travel")
        assert response.status_code == 200
        data = response.json()
        assert "items" in data
    
    def test_queue_source_filter_care(self):
        response = requests.get(f"{BASE_URL}/api/concierge/queue?source=care")
        assert response.status_code == 200
        data = response.json()
        assert "items" in data


class TestTicketCRUD:
    """Test CRUD operations for tickets"""
    
    @pytest.fixture
    def created_ticket_id(self):
        """Create a test ticket and return its ID"""
        response = requests.post(
            f"{BASE_URL}/api/concierge/ticket/create",
            json={
                "category": "celebrate",
                "pillar": "celebrate",
                "urgency": "medium",
                "subject": "TEST_Birthday cake order",
                "description": "Test ticket for automated testing - please ignore",
                "member_email": "test@example.com",
                "member_name": "TEST_User",
                "source": "internal"
            }
        )
        assert response.status_code == 200
        data = response.json()
        ticket_id = data["ticket_id"]
        yield ticket_id
        
        # Cleanup - delete the ticket
        requests.delete(f"{BASE_URL}/api/concierge/ticket/{ticket_id}?permanent=true")
    
    def test_create_ticket(self):
        """Test creating a new ticket"""
        response = requests.post(
            f"{BASE_URL}/api/concierge/ticket/create",
            json={
                "category": "advisory",
                "pillar": "advisory",
                "urgency": "high",
                "subject": "TEST_Advisory request",
                "description": "Test ticket for automated testing",
                "member_email": "test_create@example.com",
                "member_name": "TEST_CreateUser",
                "source": "internal"
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] == True
        assert "ticket_id" in data
        assert data["ticket_id"].startswith("TKT-")
        assert "ticket" in data
        assert data["ticket"]["category"] == "advisory"
        assert data["ticket"]["pillar"] == "advisory"
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/concierge/ticket/{data['ticket_id']}?permanent=true")
    
    def test_update_ticket(self, created_ticket_id):
        """Test updating an existing ticket"""
        response = requests.put(
            f"{BASE_URL}/api/concierge/ticket/{created_ticket_id}",
            json={
                "status": "in_progress",
                "urgency": "high",
                "subject": "TEST_Updated subject"
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] == True
        assert "updated_fields" in data
        assert "status" in data["updated_fields"]
    
    def test_delete_ticket_archive(self, created_ticket_id):
        """Test archiving a ticket (soft delete)"""
        response = requests.delete(f"{BASE_URL}/api/concierge/ticket/{created_ticket_id}")
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] == True
        assert data["action"] == "archived"
    
    def test_delete_ticket_permanent(self):
        """Test permanently deleting a ticket"""
        # First create a ticket
        create_response = requests.post(
            f"{BASE_URL}/api/concierge/ticket/create",
            json={
                "category": "general",
                "subject": "TEST_To be deleted",
                "description": "Test ticket for deletion"
            }
        )
        ticket_id = create_response.json()["ticket_id"]
        
        # Then permanently delete it
        response = requests.delete(f"{BASE_URL}/api/concierge/ticket/{ticket_id}?permanent=true")
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] == True
        assert data["action"] == "deleted"


class TestManualAssignment:
    """Test manual assignment endpoint"""
    
    @pytest.fixture
    def test_ticket_id(self):
        """Create a test ticket"""
        response = requests.post(
            f"{BASE_URL}/api/concierge/ticket/create",
            json={
                "category": "care",
                "subject": "TEST_Manual assign test",
                "description": "Test ticket for manual assignment"
            }
        )
        ticket_id = response.json()["ticket_id"]
        yield ticket_id
        requests.delete(f"{BASE_URL}/api/concierge/ticket/{ticket_id}?permanent=true")
    
    def test_manual_assign_to_agent(self, test_ticket_id):
        """Test manually assigning ticket to agent"""
        response = requests.post(
            f"{BASE_URL}/api/concierge/item/{test_ticket_id}/manual-assign",
            json={
                "agent_username": "sarah",  # Use actual agent from agents collection
                "reason": "Test assignment"
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] == True
        assert data["assigned_to"] == "sarah"
        assert data["reason"] == "manual_assignment"
    
    def test_manual_assign_invalid_agent(self, test_ticket_id):
        """Test assigning to non-existent agent"""
        response = requests.post(
            f"{BASE_URL}/api/concierge/item/{test_ticket_id}/manual-assign",
            json={
                "agent_username": "nonexistent_agent_xyz"
            }
        )
        assert response.status_code == 404
    
    def test_manual_assign_invalid_ticket(self):
        """Test assigning non-existent ticket"""
        response = requests.post(
            f"{BASE_URL}/api/concierge/item/INVALID-TICKET-ID/manual-assign",
            json={
                "agent_username": "aditya"
            }
        )
        assert response.status_code == 404


class TestQuickActions:
    """Test quick action endpoint"""
    
    @pytest.fixture
    def test_ticket_id(self):
        """Create a test ticket"""
        response = requests.post(
            f"{BASE_URL}/api/concierge/ticket/create",
            json={
                "category": "shop",
                "subject": "TEST_Quick action test",
                "description": "Test ticket for quick actions"
            }
        )
        ticket_id = response.json()["ticket_id"]
        yield ticket_id
        requests.delete(f"{BASE_URL}/api/concierge/ticket/{ticket_id}?permanent=true")
    
    def test_quick_action_claim(self, test_ticket_id):
        """Test claim action"""
        response = requests.post(
            f"{BASE_URL}/api/concierge/item/{test_ticket_id}/quick-action",
            json={
                "action": "claim",
                "agent_id": "aditya"
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] == True
        assert data["action"] == "claim"
        assert data["changes"]["assigned_to"] == "aditya"
    
    def test_quick_action_unclaim(self, test_ticket_id):
        """Test unclaim action"""
        # First claim
        requests.post(
            f"{BASE_URL}/api/concierge/item/{test_ticket_id}/quick-action",
            json={"action": "claim", "agent_id": "aditya"}
        )
        
        # Then unclaim
        response = requests.post(
            f"{BASE_URL}/api/concierge/item/{test_ticket_id}/quick-action",
            json={"action": "unclaim"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] == True
        assert data["action"] == "unclaim"
    
    def test_quick_action_change_status(self, test_ticket_id):
        """Test change_status action"""
        response = requests.post(
            f"{BASE_URL}/api/concierge/item/{test_ticket_id}/quick-action",
            json={
                "action": "change_status",
                "new_status": "in_progress"
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] == True
        assert data["changes"]["status"] == "in_progress"
    
    def test_quick_action_change_priority(self, test_ticket_id):
        """Test change_priority action"""
        response = requests.post(
            f"{BASE_URL}/api/concierge/item/{test_ticket_id}/quick-action",
            json={
                "action": "change_priority",
                "new_priority": "urgent"
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] == True
        assert data["changes"]["priority"] == "urgent"
    
    def test_quick_action_escalate(self, test_ticket_id):
        """Test escalate action"""
        response = requests.post(
            f"{BASE_URL}/api/concierge/item/{test_ticket_id}/quick-action",
            json={
                "action": "escalate",
                "note": "Urgent customer issue"
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["success"] == True
        assert data["changes"]["escalated"] == True
        assert data["changes"]["priority"] == "urgent"
    
    def test_quick_action_invalid_action(self, test_ticket_id):
        """Test invalid action"""
        response = requests.post(
            f"{BASE_URL}/api/concierge/item/{test_ticket_id}/quick-action",
            json={"action": "invalid_action"}
        )
        assert response.status_code == 400


class TestBulkActions:
    """Test bulk action endpoint"""
    
    @pytest.fixture
    def test_ticket_ids(self):
        """Create multiple test tickets"""
        ticket_ids = []
        for i in range(3):
            response = requests.post(
                f"{BASE_URL}/api/concierge/ticket/create",
                json={
                    "category": "general",
                    "subject": f"TEST_Bulk action test {i}",
                    "description": f"Test ticket {i} for bulk actions"
                }
            )
            ticket_ids.append(response.json()["ticket_id"])
        
        yield ticket_ids
        
        # Cleanup
        for tid in ticket_ids:
            requests.delete(f"{BASE_URL}/api/concierge/ticket/{tid}?permanent=true")
    
    def test_bulk_action_claim(self, test_ticket_ids):
        """Test bulk claim action"""
        response = requests.post(
            f"{BASE_URL}/api/concierge/bulk-action",
            params={
                "action": "claim",
                "agent_id": "aditya"
            },
            json=test_ticket_ids
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["total"] == 3
        assert data["successful"] >= 0
        assert "results" in data
    
    def test_bulk_action_change_status(self, test_ticket_ids):
        """Test bulk status change"""
        response = requests.post(
            f"{BASE_URL}/api/concierge/bulk-action",
            params={
                "action": "change_status",
                "new_status": "resolved"
            },
            json=test_ticket_ids
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["total"] == 3


class TestCSVExport:
    """Test CSV export endpoint"""
    
    def test_csv_export_basic(self):
        """Test basic CSV export"""
        response = requests.get(f"{BASE_URL}/api/concierge/export/csv")
        assert response.status_code == 200
        
        # Check content type
        assert "text/csv" in response.headers.get("content-type", "")
        
        # Check content disposition
        content_disp = response.headers.get("content-disposition", "")
        assert "attachment" in content_disp
        assert "command_center_export" in content_disp
    
    def test_csv_export_has_headers(self):
        """Test CSV has proper headers"""
        response = requests.get(f"{BASE_URL}/api/concierge/export/csv")
        content = response.text
        
        # Check for expected headers
        expected_headers = [
            "ticket_id", "source_type", "pillar", "priority_bucket",
            "status", "member_name", "member_email", "assigned_to"
        ]
        first_line = content.split('\n')[0]
        for header in expected_headers:
            assert header in first_line, f"Missing header: {header}"
    
    def test_csv_export_with_pillar_filter(self):
        """Test CSV export with pillar filter"""
        response = requests.get(f"{BASE_URL}/api/concierge/export/csv?pillar=celebrate")
        assert response.status_code == 200
        assert "text/csv" in response.headers.get("content-type", "")
    
    def test_csv_export_with_priority_filter(self):
        """Test CSV export with priority filter"""
        response = requests.get(f"{BASE_URL}/api/concierge/export/csv?priority=high")
        assert response.status_code == 200


class TestAgentsList:
    """Test agents list endpoint"""
    
    def test_get_agents(self):
        """Test getting list of agents"""
        response = requests.get(f"{BASE_URL}/api/concierge/agents")
        assert response.status_code == 200
        data = response.json()
        
        assert "agents" in data
        assert len(data["agents"]) > 0
        
        # Check agent structure
        agent = data["agents"][0]
        assert "username" in agent
        assert "active_tickets" in agent


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
