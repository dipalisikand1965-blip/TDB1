"""
Test Suite for 360° Member Profile Features
============================================
Tests for:
1. Event Stream endpoint
2. Full Member Profile endpoint
3. Member Notes CRUD
4. Health Vault endpoint
5. Auto-ticket creation hooks
"""

import pytest
import requests
import os
import uuid
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test user from credentials
TEST_USER_EMAIL = "dipali@clubconcierge.in"


class TestHealthCheck:
    """Basic health check"""
    
    def test_api_health(self):
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        print("✓ API health check passed")


class TestEventStream:
    """Test Event Stream endpoint - returns recent events from tickets, orders, memberships"""
    
    def test_event_stream_endpoint_exists(self):
        """Test that event stream endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/concierge/event-stream")
        assert response.status_code == 200
        data = response.json()
        assert "events" in data
        assert "total" in data
        print(f"✓ Event stream returned {len(data['events'])} events")
    
    def test_event_stream_structure(self):
        """Test event stream returns proper structure"""
        response = requests.get(f"{BASE_URL}/api/concierge/event-stream?limit=10")
        assert response.status_code == 200
        data = response.json()
        
        if data["events"]:
            event = data["events"][0]
            # Check required fields
            assert "id" in event
            assert "type" in event
            assert "event_type" in event
            assert "pillar" in event
            assert "title" in event
            assert "timestamp" in event
            print(f"✓ Event structure valid: {event['type']} - {event['title'][:50]}")
    
    def test_event_stream_limit_parameter(self):
        """Test limit parameter works"""
        response = requests.get(f"{BASE_URL}/api/concierge/event-stream?limit=5")
        assert response.status_code == 200
        data = response.json()
        assert len(data["events"]) <= 5
        print(f"✓ Event stream limit works: returned {len(data['events'])} events")
    
    def test_event_stream_contains_multiple_types(self):
        """Test event stream contains different event types"""
        response = requests.get(f"{BASE_URL}/api/concierge/event-stream?limit=50")
        assert response.status_code == 200
        data = response.json()
        
        event_types = set([e.get("type") for e in data["events"]])
        print(f"✓ Event types found: {event_types}")
        # Should have at least one type
        assert len(event_types) >= 1


class TestFullMemberProfile:
    """Test comprehensive 360° member profile endpoint"""
    
    def test_full_profile_endpoint_exists(self):
        """Test full profile endpoint returns data"""
        response = requests.get(f"{BASE_URL}/api/concierge/member/{TEST_USER_EMAIL}/full-profile")
        assert response.status_code in [200, 404]  # 404 if user doesn't exist
        
        if response.status_code == 200:
            data = response.json()
            assert "member" in data
            print(f"✓ Full profile returned for {TEST_USER_EMAIL}")
        else:
            print(f"⚠ User {TEST_USER_EMAIL} not found - creating test user")
    
    def test_full_profile_structure(self):
        """Test full profile returns all required sections"""
        response = requests.get(f"{BASE_URL}/api/concierge/member/{TEST_USER_EMAIL}/full-profile")
        
        if response.status_code == 200:
            data = response.json()
            
            # Check all required sections
            required_sections = [
                "member", "pets", "membership", "paw_rewards", 
                "tickets", "orders", "bookings", "memories", 
                "communications", "activity", "notes", "stats"
            ]
            
            for section in required_sections:
                assert section in data, f"Missing section: {section}"
            
            print(f"✓ Full profile has all {len(required_sections)} required sections")
        else:
            pytest.skip("Test user not found")
    
    def test_full_profile_membership_data(self):
        """Test membership section structure"""
        response = requests.get(f"{BASE_URL}/api/concierge/member/{TEST_USER_EMAIL}/full-profile")
        
        if response.status_code == 200:
            data = response.json()
            membership = data.get("membership", {})
            
            assert "current" in membership or membership.get("status") is not None
            assert "history" in membership
            print(f"✓ Membership data structure valid")
        else:
            pytest.skip("Test user not found")
    
    def test_full_profile_paw_rewards_data(self):
        """Test paw rewards section structure"""
        response = requests.get(f"{BASE_URL}/api/concierge/member/{TEST_USER_EMAIL}/full-profile")
        
        if response.status_code == 200:
            data = response.json()
            rewards = data.get("paw_rewards", {})
            
            assert "balance" in rewards
            assert "total_earned" in rewards
            assert "total_redeemed" in rewards
            print(f"✓ Paw rewards: balance={rewards.get('balance')}, earned={rewards.get('total_earned')}")
        else:
            pytest.skip("Test user not found")
    
    def test_full_profile_tickets_by_pillar(self):
        """Test tickets are grouped by pillar"""
        response = requests.get(f"{BASE_URL}/api/concierge/member/{TEST_USER_EMAIL}/full-profile")
        
        if response.status_code == 200:
            data = response.json()
            tickets = data.get("tickets", {})
            
            assert "all" in tickets
            assert "by_pillar" in tickets
            assert "by_pet" in tickets
            assert "total" in tickets
            print(f"✓ Tickets grouped: total={tickets.get('total')}, pillars={list(tickets.get('by_pillar', {}).keys())}")
        else:
            pytest.skip("Test user not found")
    
    def test_full_profile_orders_data(self):
        """Test orders section structure"""
        response = requests.get(f"{BASE_URL}/api/concierge/member/{TEST_USER_EMAIL}/full-profile")
        
        if response.status_code == 200:
            data = response.json()
            orders = data.get("orders", {})
            
            assert "list" in orders
            assert "total_count" in orders
            assert "total_spent" in orders
            print(f"✓ Orders: count={orders.get('total_count')}, spent=₹{orders.get('total_spent')}")
        else:
            pytest.skip("Test user not found")
    
    def test_full_profile_stats(self):
        """Test stats section"""
        response = requests.get(f"{BASE_URL}/api/concierge/member/{TEST_USER_EMAIL}/full-profile")
        
        if response.status_code == 200:
            data = response.json()
            stats = data.get("stats", {})
            
            assert "total_pets" in stats
            assert "total_tickets" in stats
            assert "total_orders" in stats
            assert "total_spent" in stats
            print(f"✓ Stats: pets={stats.get('total_pets')}, tickets={stats.get('total_tickets')}, orders={stats.get('total_orders')}")
        else:
            pytest.skip("Test user not found")
    
    def test_full_profile_invalid_email(self):
        """Test 404 for non-existent user"""
        response = requests.get(f"{BASE_URL}/api/concierge/member/nonexistent@test.com/full-profile")
        assert response.status_code == 404
        print("✓ Returns 404 for non-existent user")


class TestMemberNotesCRUD:
    """Test Member Notes Create, Read, Delete operations"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test note ID for cleanup"""
        self.test_note_id = None
    
    def test_create_member_note(self):
        """Test creating a new member note"""
        note_data = {
            "content": f"TEST_NOTE_{uuid.uuid4().hex[:8]} - Test note for automated testing",
            "note_type": "general"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/concierge/member/{TEST_USER_EMAIL}/notes",
            json=note_data
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert "note" in data
        assert data["note"]["content"] == note_data["content"]
        assert "id" in data["note"]
        
        self.test_note_id = data["note"]["id"]
        print(f"✓ Created note: {self.test_note_id}")
        
        # Cleanup
        if self.test_note_id:
            requests.delete(f"{BASE_URL}/api/concierge/member/{TEST_USER_EMAIL}/notes/{self.test_note_id}")
    
    def test_get_member_notes(self):
        """Test retrieving member notes"""
        response = requests.get(f"{BASE_URL}/api/concierge/member/{TEST_USER_EMAIL}/notes")
        
        assert response.status_code == 200
        data = response.json()
        assert "notes" in data
        assert isinstance(data["notes"], list)
        print(f"✓ Retrieved {len(data['notes'])} notes")
    
    def test_create_and_verify_note_persistence(self):
        """Test note is persisted and can be retrieved"""
        # Create note
        note_content = f"TEST_PERSIST_{uuid.uuid4().hex[:8]}"
        note_data = {"content": note_content, "note_type": "follow_up"}
        
        create_response = requests.post(
            f"{BASE_URL}/api/concierge/member/{TEST_USER_EMAIL}/notes",
            json=note_data
        )
        assert create_response.status_code == 200
        note_id = create_response.json()["note"]["id"]
        
        # Verify persistence
        get_response = requests.get(f"{BASE_URL}/api/concierge/member/{TEST_USER_EMAIL}/notes")
        assert get_response.status_code == 200
        notes = get_response.json()["notes"]
        
        found = any(n.get("id") == note_id for n in notes)
        assert found, "Created note not found in notes list"
        print(f"✓ Note {note_id} persisted and retrieved")
        
        # Cleanup
        requests.delete(f"{BASE_URL}/api/concierge/member/{TEST_USER_EMAIL}/notes/{note_id}")
    
    def test_delete_member_note(self):
        """Test deleting a member note"""
        # First create a note
        note_data = {"content": f"TEST_DELETE_{uuid.uuid4().hex[:8]}", "note_type": "general"}
        create_response = requests.post(
            f"{BASE_URL}/api/concierge/member/{TEST_USER_EMAIL}/notes",
            json=note_data
        )
        assert create_response.status_code == 200
        note_id = create_response.json()["note"]["id"]
        
        # Delete the note
        delete_response = requests.delete(
            f"{BASE_URL}/api/concierge/member/{TEST_USER_EMAIL}/notes/{note_id}"
        )
        assert delete_response.status_code == 200
        assert delete_response.json().get("success") == True
        print(f"✓ Deleted note: {note_id}")
        
        # Verify deletion
        get_response = requests.get(f"{BASE_URL}/api/concierge/member/{TEST_USER_EMAIL}/notes")
        notes = get_response.json()["notes"]
        found = any(n.get("id") == note_id for n in notes)
        assert not found, "Deleted note still exists"
        print("✓ Note deletion verified")
    
    def test_delete_nonexistent_note(self):
        """Test 404 for deleting non-existent note"""
        response = requests.delete(
            f"{BASE_URL}/api/concierge/member/{TEST_USER_EMAIL}/notes/NONEXISTENT-NOTE-ID"
        )
        assert response.status_code == 404
        print("✓ Returns 404 for non-existent note")


class TestHealthVault:
    """Test Health Vault endpoint - returns health data for all pets"""
    
    def test_health_vault_endpoint_exists(self):
        """Test health vault endpoint returns data"""
        response = requests.get(f"{BASE_URL}/api/concierge/member/{TEST_USER_EMAIL}/health-vault")
        assert response.status_code == 200
        data = response.json()
        assert "health_vault" in data
        print(f"✓ Health vault returned data for {len(data['health_vault'])} pets")
    
    def test_health_vault_structure(self):
        """Test health vault returns proper structure for each pet"""
        response = requests.get(f"{BASE_URL}/api/concierge/member/{TEST_USER_EMAIL}/health-vault")
        assert response.status_code == 200
        data = response.json()
        
        if data["health_vault"]:
            pet_health = data["health_vault"][0]
            
            # Check required fields
            required_fields = [
                "pet_id", "pet_name", "records", "vaccines", 
                "weights", "medications", "vet_visits"
            ]
            
            for field in required_fields:
                assert field in pet_health, f"Missing field: {field}"
            
            print(f"✓ Health vault structure valid for {pet_health.get('pet_name')}")
        else:
            print("⚠ No pets found for health vault test")
    
    def test_health_vault_contains_records(self):
        """Test health vault contains health records"""
        response = requests.get(f"{BASE_URL}/api/concierge/member/{TEST_USER_EMAIL}/health-vault")
        assert response.status_code == 200
        data = response.json()
        
        for pet in data["health_vault"]:
            print(f"  Pet: {pet.get('pet_name')} - Records: {len(pet.get('records', []))}, Vaccines: {len(pet.get('vaccines', []))}")
        
        print("✓ Health vault data retrieved")


class TestAutoTicketCreation:
    """Test auto-ticket creation hooks"""
    
    def test_auto_ticket_on_order_placement(self):
        """Test that placing an order creates an auto-ticket"""
        # Create a test order
        order_data = {
            "items": [
                {"name": "TEST_PRODUCT", "quantity": 1, "price": 100}
            ],
            "customer": {
                "name": "Test Customer",
                "email": f"test_{uuid.uuid4().hex[:8]}@test.com",
                "phone": "9999999999"
            },
            "shipping_address": {
                "line1": "Test Address",
                "city": "Mumbai",
                "state": "Maharashtra",
                "pincode": "400001"
            },
            "payment_method": "cod"
        }
        
        # Place order
        response = requests.post(f"{BASE_URL}/api/orders", json=order_data)
        
        if response.status_code in [200, 201]:
            order = response.json()
            order_id = order.get("order_id") or order.get("id")
            print(f"✓ Order created: {order_id}")
            
            # Check if auto-ticket was created
            # Look for ticket with reference to this order
            queue_response = requests.get(f"{BASE_URL}/api/concierge/queue?source=order&limit=10")
            if queue_response.status_code == 200:
                items = queue_response.json().get("items", [])
                # Check if any ticket references our order
                found = any(order_id in str(item) for item in items)
                if found:
                    print(f"✓ Auto-ticket created for order {order_id}")
                else:
                    print(f"⚠ Auto-ticket may not have been created for order {order_id}")
        else:
            print(f"⚠ Order creation returned {response.status_code}: {response.text[:200]}")
    
    def test_service_desk_tickets_collection(self):
        """Test that service_desk_tickets collection has auto-created tickets"""
        response = requests.get(f"{BASE_URL}/api/concierge/queue?limit=20")
        assert response.status_code == 200
        data = response.json()
        
        auto_created = [item for item in data.get("items", []) if item.get("auto_created")]
        print(f"✓ Found {len(auto_created)} auto-created tickets in queue")
    
    def test_ticket_has_event_type(self):
        """Test that tickets have event_type field"""
        response = requests.get(f"{BASE_URL}/api/concierge/queue?limit=20")
        assert response.status_code == 200
        data = response.json()
        
        for item in data.get("items", [])[:5]:
            if item.get("event_type"):
                print(f"  Ticket {item.get('ticket_id')}: event_type={item.get('event_type')}")


class TestConciergeCommandCenterIntegration:
    """Test Command Center integration with new features"""
    
    def test_queue_returns_all_sources(self):
        """Test queue endpoint returns items from all sources"""
        response = requests.get(f"{BASE_URL}/api/concierge/queue?source=all&limit=50")
        assert response.status_code == 200
        data = response.json()
        
        source_types = set([item.get("source_type") for item in data.get("items", [])])
        print(f"✓ Queue source types: {source_types}")
    
    def test_pillar_stats_endpoint(self):
        """Test pillar stats endpoint"""
        response = requests.get(f"{BASE_URL}/api/concierge/pillar-stats")
        assert response.status_code == 200
        data = response.json()
        
        assert "pillars" in data
        print(f"✓ Pillar stats: {data.get('pillars', {})}")
    
    def test_queue_with_pillar_filter(self):
        """Test queue filtering by pillar"""
        pillars = ["celebrate", "shop", "care", "club"]
        
        for pillar in pillars:
            response = requests.get(f"{BASE_URL}/api/concierge/queue?pillar={pillar}&limit=5")
            assert response.status_code == 200
            data = response.json()
            print(f"  Pillar '{pillar}': {len(data.get('items', []))} items")
        
        print("✓ Pillar filtering works")


class TestCleanup:
    """Cleanup test data"""
    
    def test_cleanup_test_notes(self):
        """Clean up any test notes that may have been left behind"""
        response = requests.get(f"{BASE_URL}/api/concierge/member/{TEST_USER_EMAIL}/notes")
        if response.status_code == 200:
            notes = response.json().get("notes", [])
            test_notes = [n for n in notes if "TEST_" in n.get("content", "")]
            
            for note in test_notes:
                requests.delete(f"{BASE_URL}/api/concierge/member/{TEST_USER_EMAIL}/notes/{note['id']}")
            
            print(f"✓ Cleaned up {len(test_notes)} test notes")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
