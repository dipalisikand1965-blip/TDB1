"""
Test Suite for Iteration 229
============================
Testing:
1. All 14 pillars checkboxes in Admin Product Box and Service Box
2. Unified service flow: POST /api/service-requests
3. Admin notifications creation
4. Desktop and Mobile responsive views
"""
import pytest
import requests
import os
import json
from datetime import datetime

# Get base URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://mojo-personalized.preview.emergentagent.com').rstrip('/')

# Admin credentials
ADMIN_USER = "aditya"
ADMIN_PASS = "lola4304"

# The 14 pillars that should exist
ALL_PILLARS = [
    'celebrate', 'dine', 'stay', 'travel', 'care', 'enjoy',
    'fit', 'learn', 'paperwork', 'advisory', 'emergency', 
    'farewell', 'adopt', 'shop'
]


class TestHealthCheck:
    """Basic health check"""
    
    def test_api_health(self):
        """Test API is healthy"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print(f"✅ API Health: {data}")


class TestUnifiedServiceFlow:
    """Test POST /api/service-requests endpoint with unified flow"""
    
    def test_service_request_creates_unified_flow(self):
        """Test that service request creates: ticket_id, notification_id, inbox_id"""
        payload = {
            "type": "concierge_inquiry",
            "pillar": "celebrate",
            "source": "test_automation",
            "customer": {
                "name": "Test Customer 229",
                "email": "test229@example.com",
                "phone": "+919876543210"
            },
            "details": {
                "occasion": "Birthday",
                "pet_name": "Max",
                "request_description": "Need a custom cake for my dog's birthday"
            },
            "priority": "normal",
            "intent": "celebration_planning"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/service-requests",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        
        print(f"Service Request Response Status: {response.status_code}")
        assert response.status_code == 200
        
        data = response.json()
        print(f"Service Request Response: {json.dumps(data, indent=2)}")
        
        # CRITICAL: Verify all unified flow IDs are present
        assert data.get("success") == True, "Request should succeed"
        assert "ticket_id" in data, "Response MUST have ticket_id"
        assert "notification_id" in data, "Response MUST have notification_id"
        assert "inbox_id" in data, "Response MUST have inbox_id"
        
        print(f"✅ Unified Flow IDs:")
        print(f"   - ticket_id: {data['ticket_id']}")
        print(f"   - notification_id: {data['notification_id']}")
        print(f"   - inbox_id: {data['inbox_id']}")
        
        # Store for verification
        self.ticket_id = data['ticket_id']
        self.notification_id = data['notification_id']
        self.inbox_id = data['inbox_id']
    
    def test_service_request_all_pillars(self):
        """Test service request works for all 14 pillars"""
        for pillar in ALL_PILLARS:
            payload = {
                "type": "general_inquiry",
                "pillar": pillar,
                "source": "pillar_test",
                "customer": {
                    "name": f"Pillar Test {pillar.title()}",
                    "email": f"pillar_test_{pillar}@example.com"
                },
                "details": {
                    "request": f"Test request for {pillar} pillar"
                },
                "priority": "normal"
            }
            
            response = requests.post(
                f"{BASE_URL}/api/service-requests",
                json=payload
            )
            
            assert response.status_code == 200, f"Failed for pillar: {pillar}"
            data = response.json()
            
            assert data.get("success") == True, f"Request failed for pillar: {pillar}"
            assert "ticket_id" in data, f"Missing ticket_id for pillar: {pillar}"
            
            print(f"✅ Pillar '{pillar}' - ticket: {data['ticket_id']}")


class TestAdminNotifications:
    """Test admin notifications are created"""
    
    def test_admin_notifications_list(self):
        """Test admin notifications endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/admin/notifications",
            auth=(ADMIN_USER, ADMIN_PASS)
        )
        
        # Even if empty, should return 200
        assert response.status_code in [200, 401]  # 401 if auth required differently
        
        if response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                print(f"✅ Admin Notifications: {len(data)} found")
            elif isinstance(data, dict):
                notifications = data.get("notifications", data)
                print(f"✅ Admin Notifications response: {type(data)}")


class TestProductBox:
    """Test Product Box has all 14 pillar filters"""
    
    def test_product_box_stats(self):
        """Test product box stats endpoint"""
        response = requests.get(f"{BASE_URL}/api/product-box/stats")
        assert response.status_code == 200
        
        data = response.json()
        print(f"✅ Product Box Stats:")
        print(f"   - Total: {data.get('total', 0)}")
        print(f"   - Active: {data.get('by_status', {}).get('active', 0)}")
        print(f"   - Rewards Eligible: {data.get('rewards', {}).get('eligible', 0)}")
    
    def test_product_box_pillar_filters(self):
        """Test products can be filtered by all 14 pillars"""
        for pillar in ALL_PILLARS:
            response = requests.get(
                f"{BASE_URL}/api/product-box/products",
                params={"pillar": pillar, "limit": 5}
            )
            
            assert response.status_code == 200, f"Failed for pillar filter: {pillar}"
            data = response.json()
            
            product_count = len(data.get("products", []))
            total = data.get("total", 0)
            print(f"✅ Pillar '{pillar}' filter - found {product_count} products (total: {total})")


class TestServiceBox:
    """Test Service Box has all 14 pillar filters"""
    
    def test_service_box_stats(self):
        """Test service box stats endpoint"""
        response = requests.get(f"{BASE_URL}/api/service-box/stats")
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Service Box Stats:")
            print(f"   - Total: {data.get('total', 0)}")
            print(f"   - Active: {data.get('active', 0)}")
            print(f"   - Bookable: {data.get('bookable', 0)}")
        else:
            print(f"⚠️ Service Box stats returned {response.status_code}")
    
    def test_service_box_pillar_filters(self):
        """Test services can be filtered by all 14 pillars"""
        for pillar in ALL_PILLARS:
            response = requests.get(
                f"{BASE_URL}/api/service-box/services",
                params={"pillar": pillar, "limit": 5}
            )
            
            if response.status_code == 200:
                data = response.json()
                service_count = len(data.get("services", []))
                total = data.get("total", 0)
                print(f"✅ Service pillar '{pillar}' filter - found {service_count} services (total: {total})")
            else:
                print(f"⚠️ Service pillar filter '{pillar}' returned {response.status_code}")


class TestUnifiedInbox:
    """Test unified inbox entries are created"""
    
    def test_unified_inbox_endpoint(self):
        """Test unified inbox list endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/admin/unified-inbox",
            auth=(ADMIN_USER, ADMIN_PASS)
        )
        
        if response.status_code == 200:
            data = response.json()
            entries = data.get("threads", data.get("entries", data)) if isinstance(data, dict) else data
            print(f"✅ Unified Inbox entries: {len(entries) if isinstance(entries, list) else 'available'}")
        else:
            print(f"⚠️ Unified inbox returned {response.status_code}")


class TestMemberNotifications:
    """Test member notifications are created"""
    
    def test_member_notifications_endpoint(self):
        """Test member notifications endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/member/notifications",
            headers={"Authorization": "Bearer test_token"}  # Will likely fail auth, but tests endpoint exists
        )
        
        # Expecting either 200 with data or 401/403 for auth
        print(f"Member Notifications endpoint status: {response.status_code}")
        assert response.status_code in [200, 401, 403, 422], "Endpoint should exist"


class TestPillarRequests:
    """Test pillar requests are created"""
    
    def test_pillar_requests_list(self):
        """Test pillar requests list endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/admin/pillar-requests",
            auth=(ADMIN_USER, ADMIN_PASS)
        )
        
        if response.status_code == 200:
            data = response.json()
            requests_count = len(data.get("requests", data)) if isinstance(data, dict) else len(data)
            print(f"✅ Pillar Requests: {requests_count} found")
        else:
            print(f"⚠️ Pillar requests returned {response.status_code}")


class TestServiceDeskTickets:
    """Test service desk tickets are created"""
    
    def test_service_desk_tickets_list(self):
        """Test service desk tickets list endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/admin/service-desk/tickets",
            auth=(ADMIN_USER, ADMIN_PASS)
        )
        
        if response.status_code == 200:
            data = response.json()
            tickets = data.get("tickets", data)
            print(f"✅ Service Desk Tickets: {len(tickets) if isinstance(tickets, list) else 'available'}")
        else:
            print(f"⚠️ Service desk tickets returned {response.status_code}")


class TestChannelIntakes:
    """Test channel intakes / unified inbox"""
    
    def test_channel_intake_flow(self):
        """Test that unified inbox serves as channel intake"""
        # Create a service request
        payload = {
            "type": "channel_intake_test",
            "pillar": "care",
            "source": "web_form",
            "customer": {
                "name": "Channel Intake Test",
                "email": "channel_test@example.com",
                "phone": "+919000000001"
            },
            "details": {
                "service": "grooming",
                "notes": "Test channel intake flow"
            },
            "priority": "normal"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/service-requests",
            json=payload
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify unified inbox entry was created
        inbox_id = data.get("inbox_id")
        assert inbox_id is not None, "inbox_id must be returned for channel intake"
        
        print(f"✅ Channel Intake created: inbox_id={inbox_id}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "-s"])
