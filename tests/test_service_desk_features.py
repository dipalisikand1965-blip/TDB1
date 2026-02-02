"""
Service Desk Feature Tests
Tests for:
- Quick Filters (All, Unassigned, Critical, Today)
- Bulk ticket selection and actions
- Activity Timeline
- New ticket sources (Travel, Care, Grooming)
- Reply box functionality
- Service request endpoint for Travel/Care/Grooming
"""

import pytest
import requests
import os
from datetime import datetime, timezone

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://petlifecentral.preview.emergentagent.com').rstrip('/')
ADMIN_USERNAME = "aditya"
ADMIN_PASSWORD = "doggy2026"


class TestServiceDeskAPIs:
    """Test Service Desk backend APIs"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session with auth"""
        self.session = requests.Session()
        self.session.auth = (ADMIN_USERNAME, ADMIN_PASSWORD)
        self.session.headers.update({"Content-Type": "application/json"})
    
    # ============== TICKET LISTING & STATS ==============
    
    def test_get_tickets_list(self):
        """Test fetching tickets list"""
        response = self.session.get(f"{BASE_URL}/api/tickets/")
        assert response.status_code == 200
        data = response.json()
        assert "tickets" in data
        assert "total" in data
        print(f"✓ Tickets list: {data['total']} total tickets")
    
    def test_get_ticket_stats(self):
        """Test fetching ticket statistics"""
        response = self.session.get(f"{BASE_URL}/api/tickets/stats")
        assert response.status_code == 200
        data = response.json()
        assert "total_open" in data
        assert "by_status" in data
        assert "by_category" in data
        assert "by_urgency" in data
        print(f"✓ Ticket stats: {data['total_open']} open tickets")
        print(f"  - By urgency: critical={data['by_urgency'].get('critical', 0)}, high={data['by_urgency'].get('high', 0)}")
    
    def test_get_ticket_categories(self):
        """Test fetching ticket categories (pillars)"""
        response = self.session.get(f"{BASE_URL}/api/tickets/categories")
        assert response.status_code == 200
        data = response.json()
        assert "categories" in data
        categories = [c['id'] for c in data['categories']]
        # Verify all pillars are present
        assert "celebrate" in categories
        assert "dine" in categories
        assert "stay" in categories
        assert "travel" in categories
        assert "care" in categories
        print(f"✓ Categories: {len(data['categories'])} categories including all pillars")
    
    def test_get_ticket_statuses(self):
        """Test fetching ticket statuses"""
        response = self.session.get(f"{BASE_URL}/api/tickets/statuses")
        assert response.status_code == 200
        data = response.json()
        assert "statuses" in data
        status_ids = [s['id'] for s in data['statuses']]
        assert "new" in status_ids
        assert "in_progress" in status_ids
        assert "resolved" in status_ids
        print(f"✓ Statuses: {len(data['statuses'])} statuses available")
    
    def test_get_concierges(self):
        """Test fetching concierges for assignment"""
        response = self.session.get(f"{BASE_URL}/api/tickets/concierges")
        assert response.status_code == 200
        data = response.json()
        assert "concierges" in data
        assert len(data['concierges']) > 0
        print(f"✓ Concierges: {len(data['concierges'])} concierges available")
    
    # ============== QUICK FILTERS ==============
    
    def test_filter_by_status_open(self):
        """Test filtering tickets by open status"""
        response = self.session.get(f"{BASE_URL}/api/tickets/?status=open")
        assert response.status_code == 200
        data = response.json()
        # All returned tickets should not be resolved or closed
        for ticket in data['tickets']:
            assert ticket['status'] not in ['resolved', 'closed']
        print(f"✓ Open filter: {len(data['tickets'])} open tickets")
    
    def test_filter_by_urgency_critical(self):
        """Test filtering tickets by critical urgency"""
        response = self.session.get(f"{BASE_URL}/api/tickets/?urgency=critical")
        assert response.status_code == 200
        data = response.json()
        for ticket in data['tickets']:
            assert ticket['urgency'] == 'critical'
        print(f"✓ Critical filter: {len(data['tickets'])} critical tickets")
    
    def test_filter_by_urgency_high(self):
        """Test filtering tickets by high urgency"""
        response = self.session.get(f"{BASE_URL}/api/tickets/?urgency=high")
        assert response.status_code == 200
        data = response.json()
        for ticket in data['tickets']:
            assert ticket['urgency'] == 'high'
        print(f"✓ High urgency filter: {len(data['tickets'])} high priority tickets")
    
    def test_filter_by_category_travel(self):
        """Test filtering tickets by travel category"""
        response = self.session.get(f"{BASE_URL}/api/tickets/?category=travel")
        assert response.status_code == 200
        data = response.json()
        for ticket in data['tickets']:
            assert ticket['category'] == 'travel'
        print(f"✓ Travel category filter: {len(data['tickets'])} travel tickets")
    
    def test_filter_by_category_care(self):
        """Test filtering tickets by care category"""
        response = self.session.get(f"{BASE_URL}/api/tickets/?category=care")
        assert response.status_code == 200
        data = response.json()
        for ticket in data['tickets']:
            assert ticket['category'] == 'care'
        print(f"✓ Care category filter: {len(data['tickets'])} care tickets")
    
    def test_filter_by_source_travel_booking(self):
        """Test filtering tickets by travel_booking source"""
        response = self.session.get(f"{BASE_URL}/api/tickets/?source=travel_booking")
        assert response.status_code == 200
        data = response.json()
        for ticket in data['tickets']:
            assert ticket['source'] == 'travel_booking'
        print(f"✓ Travel booking source filter: {len(data['tickets'])} tickets")
    
    def test_filter_by_source_care_appointment(self):
        """Test filtering tickets by care_appointment source"""
        response = self.session.get(f"{BASE_URL}/api/tickets/?source=care_appointment")
        assert response.status_code == 200
        data = response.json()
        for ticket in data['tickets']:
            assert ticket['source'] == 'care_appointment'
        print(f"✓ Care appointment source filter: {len(data['tickets'])} tickets")
    
    def test_filter_by_source_grooming(self):
        """Test filtering tickets by grooming source"""
        response = self.session.get(f"{BASE_URL}/api/tickets/?source=grooming")
        assert response.status_code == 200
        data = response.json()
        print(f"✓ Grooming source filter: {len(data['tickets'])} tickets")
    
    # ============== SERVICE REQUEST ENDPOINT ==============
    
    def test_create_travel_booking_ticket(self):
        """Test creating a travel booking ticket via service-request endpoint"""
        payload = {
            "event_type": "travel_booking",
            "name": "TEST_Travel_User",
            "email": "test_travel@example.com",
            "phone": "+919876543210",
            "city": "Mumbai",
            "pet_name": "Bruno",
            "pet_breed": "Labrador",
            "pet_weight_kg": 25.0,
            "origin_city": "Mumbai",
            "destination_city": "Delhi",
            "travel_date": "2025-01-15",
            "return_date": "2025-01-20",
            "travel_type": "Domestic",
            "special_requirements": "Pet needs extra space"
        }
        response = self.session.post(f"{BASE_URL}/api/tickets/service-request", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data['success'] == True
        assert 'ticket_id' in data
        assert 'request_id' in data
        print(f"✓ Travel booking ticket created: {data['ticket_id']}")
        
        # Verify ticket was created with correct category
        ticket_response = self.session.get(f"{BASE_URL}/api/tickets/{data['ticket_id']}")
        assert ticket_response.status_code == 200
        ticket = ticket_response.json()['ticket']
        assert ticket['category'] == 'travel'
        assert ticket['source'] == 'travel_booking'
        assert 'Mumbai' in ticket['description']
        assert 'Delhi' in ticket['description']
        print(f"  - Verified ticket category: {ticket['category']}, source: {ticket['source']}")
        
        # Cleanup
        self.session.delete(f"{BASE_URL}/api/tickets/{data['ticket_id']}")
    
    def test_create_care_appointment_ticket(self):
        """Test creating a care appointment ticket via service-request endpoint"""
        payload = {
            "event_type": "care_appointment",
            "name": "TEST_Care_User",
            "email": "test_care@example.com",
            "phone": "+919876543211",
            "city": "Bangalore",
            "pet_name": "Max",
            "pet_breed": "Golden Retriever",
            "pet_age": "3 years",
            "pet_weight_kg": 30.0,
            "service_type": "Vet Consultation",
            "preferred_date": "2025-01-10",
            "preferred_time": "10:00 AM",
            "is_emergency": False,
            "symptoms": "Regular checkup",
            "concerns": "Vaccination due"
        }
        response = self.session.post(f"{BASE_URL}/api/tickets/service-request", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data['success'] == True
        assert 'ticket_id' in data
        print(f"✓ Care appointment ticket created: {data['ticket_id']}")
        
        # Verify ticket was created with correct category
        ticket_response = self.session.get(f"{BASE_URL}/api/tickets/{data['ticket_id']}")
        assert ticket_response.status_code == 200
        ticket = ticket_response.json()['ticket']
        assert ticket['category'] == 'care'
        assert ticket['source'] == 'care_appointment'
        assert 'Max' in ticket['description']
        print(f"  - Verified ticket category: {ticket['category']}, source: {ticket['source']}")
        
        # Cleanup
        self.session.delete(f"{BASE_URL}/api/tickets/{data['ticket_id']}")
    
    def test_create_grooming_appointment_ticket(self):
        """Test creating a grooming appointment ticket via service-request endpoint"""
        payload = {
            "event_type": "grooming_appointment",
            "name": "TEST_Grooming_User",
            "email": "test_grooming@example.com",
            "phone": "+919876543212",
            "city": "Delhi",
            "pet_name": "Bella",
            "pet_breed": "Poodle",
            "pet_weight_kg": 8.0,
            "service_type": "Full Grooming",
            "preferred_date": "2025-01-12",
            "preferred_time": "2:00 PM",
            "special_requirements": "Sensitive skin, use gentle shampoo"
        }
        response = self.session.post(f"{BASE_URL}/api/tickets/service-request", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data['success'] == True
        assert 'ticket_id' in data
        print(f"✓ Grooming appointment ticket created: {data['ticket_id']}")
        
        # Verify ticket was created with correct category
        ticket_response = self.session.get(f"{BASE_URL}/api/tickets/{data['ticket_id']}")
        assert ticket_response.status_code == 200
        ticket = ticket_response.json()['ticket']
        assert ticket['category'] == 'care'  # Grooming is under care category
        assert ticket['source'] == 'grooming'
        assert 'Bella' in ticket['description']
        print(f"  - Verified ticket category: {ticket['category']}, source: {ticket['source']}")
        
        # Cleanup
        self.session.delete(f"{BASE_URL}/api/tickets/{data['ticket_id']}")
    
    # ============== SINGLE TICKET OPERATIONS ==============
    
    def test_get_single_ticket(self):
        """Test fetching a single ticket with activity timeline data"""
        # First get a ticket ID
        response = self.session.get(f"{BASE_URL}/api/tickets/?limit=1")
        assert response.status_code == 200
        tickets = response.json()['tickets']
        if len(tickets) == 0:
            pytest.skip("No tickets available for testing")
        
        ticket_id = tickets[0]['ticket_id']
        
        # Fetch single ticket
        response = self.session.get(f"{BASE_URL}/api/tickets/{ticket_id}")
        assert response.status_code == 200
        data = response.json()
        assert 'ticket' in data
        ticket = data['ticket']
        
        # Verify activity timeline fields exist
        assert 'created_at' in ticket
        assert 'messages' in ticket
        assert 'status' in ticket
        print(f"✓ Single ticket fetched: {ticket_id}")
        print(f"  - Created: {ticket['created_at']}")
        print(f"  - Status: {ticket['status']}")
        print(f"  - Messages: {len(ticket.get('messages', []))}")
    
    def test_ticket_reply(self):
        """Test adding a reply to a ticket"""
        # Create a test ticket first
        create_payload = {
            "member": {
                "name": "TEST_Reply_User",
                "email": "test_reply@example.com",
                "phone": "+919876543213"
            },
            "category": "shop",
            "urgency": "medium",
            "description": "Test ticket for reply testing",
            "source": "internal"
        }
        create_response = self.session.post(f"{BASE_URL}/api/tickets/", json=create_payload)
        assert create_response.status_code == 200
        ticket_id = create_response.json()['ticket']['ticket_id']
        
        # Add internal note
        reply_payload = {
            "message": "This is a test internal note",
            "is_internal": True
        }
        reply_response = self.session.post(f"{BASE_URL}/api/tickets/{ticket_id}/reply", json=reply_payload)
        assert reply_response.status_code == 200
        assert reply_response.json()['success'] == True
        print(f"✓ Internal note added to ticket {ticket_id}")
        
        # Add external reply
        reply_payload = {
            "message": "This is a test reply to customer",
            "is_internal": False,
            "channel": "email"
        }
        reply_response = self.session.post(f"{BASE_URL}/api/tickets/{ticket_id}/reply", json=reply_payload)
        assert reply_response.status_code == 200
        assert reply_response.json()['success'] == True
        print(f"✓ External reply added to ticket {ticket_id}")
        
        # Verify messages were added
        ticket_response = self.session.get(f"{BASE_URL}/api/tickets/{ticket_id}")
        ticket = ticket_response.json()['ticket']
        assert len(ticket['messages']) >= 3  # Initial + 2 replies
        print(f"  - Total messages: {len(ticket['messages'])}")
        
        # Cleanup
        self.session.delete(f"{BASE_URL}/api/tickets/{ticket_id}")
    
    def test_ticket_assign(self):
        """Test assigning a ticket to a concierge"""
        # Create a test ticket
        create_payload = {
            "member": {
                "name": "TEST_Assign_User",
                "email": "test_assign@example.com"
            },
            "category": "shop",
            "urgency": "medium",
            "description": "Test ticket for assignment testing",
            "source": "internal"
        }
        create_response = self.session.post(f"{BASE_URL}/api/tickets/", json=create_payload)
        assert create_response.status_code == 200
        ticket_id = create_response.json()['ticket']['ticket_id']
        
        # Assign ticket
        assign_response = self.session.post(
            f"{BASE_URL}/api/tickets/{ticket_id}/assign",
            data={"assignee": "aditya"}
        )
        assert assign_response.status_code == 200
        assert assign_response.json()['success'] == True
        print(f"✓ Ticket {ticket_id} assigned to aditya")
        
        # Verify assignment
        ticket_response = self.session.get(f"{BASE_URL}/api/tickets/{ticket_id}")
        ticket = ticket_response.json()['ticket']
        assert ticket['assigned_to'] == 'aditya'
        print(f"  - Verified assignment: {ticket['assigned_to']}")
        
        # Cleanup
        self.session.delete(f"{BASE_URL}/api/tickets/{ticket_id}")
    
    def test_ticket_status_change(self):
        """Test changing ticket status"""
        # Create a test ticket
        create_payload = {
            "member": {
                "name": "TEST_Status_User",
                "email": "test_status@example.com"
            },
            "category": "shop",
            "urgency": "medium",
            "description": "Test ticket for status change testing",
            "source": "internal"
        }
        create_response = self.session.post(f"{BASE_URL}/api/tickets/", json=create_payload)
        assert create_response.status_code == 200
        ticket_id = create_response.json()['ticket']['ticket_id']
        
        # Change status to in_progress
        update_response = self.session.patch(
            f"{BASE_URL}/api/tickets/{ticket_id}",
            json={"status": "in_progress"}
        )
        assert update_response.status_code == 200
        print(f"✓ Ticket {ticket_id} status changed to in_progress")
        
        # Verify status change
        ticket_response = self.session.get(f"{BASE_URL}/api/tickets/{ticket_id}")
        ticket = ticket_response.json()['ticket']
        assert ticket['status'] == 'in_progress'
        
        # Cleanup
        self.session.delete(f"{BASE_URL}/api/tickets/{ticket_id}")
    
    # ============== BULK OPERATIONS ==============
    
    def test_bulk_assign_tickets(self):
        """Test bulk assigning multiple tickets"""
        # Create test tickets
        ticket_ids = []
        for i in range(2):
            create_payload = {
                "member": {
                    "name": f"TEST_Bulk_Assign_{i}",
                    "email": f"test_bulk_assign_{i}@example.com"
                },
                "category": "shop",
                "urgency": "medium",
                "description": f"Test ticket {i} for bulk assign testing",
                "source": "internal"
            }
            create_response = self.session.post(f"{BASE_URL}/api/tickets/", json=create_payload)
            assert create_response.status_code == 200
            ticket_ids.append(create_response.json()['ticket']['ticket_id'])
        
        # Bulk assign
        bulk_response = self.session.post(
            f"{BASE_URL}/api/tickets/bulk/assign",
            json={"ticket_ids": ticket_ids, "assignee": "aditya"}
        )
        assert bulk_response.status_code == 200
        data = bulk_response.json()
        assert data['success'] == True
        assert data['modified_count'] == 2
        print(f"✓ Bulk assigned {data['modified_count']} tickets to aditya")
        
        # Cleanup
        for tid in ticket_ids:
            self.session.delete(f"{BASE_URL}/api/tickets/{tid}")
    
    def test_bulk_status_change(self):
        """Test bulk status change for multiple tickets"""
        # Create test tickets
        ticket_ids = []
        for i in range(2):
            create_payload = {
                "member": {
                    "name": f"TEST_Bulk_Status_{i}",
                    "email": f"test_bulk_status_{i}@example.com"
                },
                "category": "shop",
                "urgency": "medium",
                "description": f"Test ticket {i} for bulk status testing",
                "source": "internal"
            }
            create_response = self.session.post(f"{BASE_URL}/api/tickets/", json=create_payload)
            assert create_response.status_code == 200
            ticket_ids.append(create_response.json()['ticket']['ticket_id'])
        
        # Bulk status change
        bulk_response = self.session.post(
            f"{BASE_URL}/api/tickets/bulk/status",
            json={"ticket_ids": ticket_ids, "status": "in_progress"}
        )
        assert bulk_response.status_code == 200
        data = bulk_response.json()
        assert data['success'] == True
        assert data['modified_count'] == 2
        print(f"✓ Bulk status changed {data['modified_count']} tickets to in_progress")
        
        # Cleanup
        for tid in ticket_ids:
            self.session.delete(f"{BASE_URL}/api/tickets/{tid}")
    
    def test_bulk_delete_tickets(self):
        """Test bulk deleting multiple tickets"""
        # Create test tickets
        ticket_ids = []
        for i in range(2):
            create_payload = {
                "member": {
                    "name": f"TEST_Bulk_Delete_{i}",
                    "email": f"test_bulk_delete_{i}@example.com"
                },
                "category": "shop",
                "urgency": "medium",
                "description": f"Test ticket {i} for bulk delete testing",
                "source": "internal"
            }
            create_response = self.session.post(f"{BASE_URL}/api/tickets/", json=create_payload)
            assert create_response.status_code == 200
            ticket_ids.append(create_response.json()['ticket']['ticket_id'])
        
        # Bulk delete
        bulk_response = self.session.delete(
            f"{BASE_URL}/api/tickets/bulk/delete",
            json={"ticket_ids": ticket_ids}
        )
        assert bulk_response.status_code == 200
        data = bulk_response.json()
        assert data['success'] == True
        assert data['deleted_count'] == 2
        print(f"✓ Bulk deleted {data['deleted_count']} tickets")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
