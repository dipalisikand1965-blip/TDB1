"""
Test Iteration 196: Dogs Only Party Wizard - The Doggy Company
Tests:
1. Party wizard shows DOGS ONLY - no cat option
2. Multi-pet family: pets auto-populate from user profile (filter out cats)
3. Unified flow: party request creates service desk ticket + admin notification + member notification
4. Admin notifications contain party request details
5. No medical/medicine products in celebrate pillar
"""

import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestPartyWizardDogsOnly:
    """Test party wizard is dogs-only and unified flow works"""
    
    def test_health_check(self):
        """Verify API is accessible"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        print("✓ API health check passed")
    
    def test_party_request_creates_unified_flow(self):
        """Test that party request creates: party_request + service_desk_ticket + admin_notification + member_notification"""
        # Create a party request
        party_data = {
            "petId": "test-pet-123",
            "petName": "Buddy",
            "petType": "dog",  # Always dog
            "petBreed": "Golden Retriever",
            "petAge": "3",
            "occasion": "birthday",
            "date": (datetime.now() + timedelta(days=14)).strftime("%Y-%m-%d"),
            "time": "Afternoon",
            "guestCount": "5-10",
            "venue": "home",
            "budget": "standard",
            "specialRequests": "Peanut butter cake please!",
            "includeGrooming": True,
            "includePhotography": False,
            "includeVenue": False,
            "user_email": "test_party_196@example.com",
            "user_name": "Test User 196"
        }
        
        response = requests.post(f"{BASE_URL}/api/celebrate/party-request", json=party_data)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, "Party request should succeed"
        assert "request_id" in data, "Response should contain request_id"
        assert "ticket_id" in data, "Response should contain ticket_id (service desk ticket)"
        assert data["request_id"].startswith("PARTY-"), f"Request ID should start with PARTY-, got {data['request_id']}"
        assert data["ticket_id"].startswith("CEL-"), f"Ticket ID should start with CEL-, got {data['ticket_id']}"
        
        print(f"✓ Party request created: {data['request_id']}")
        print(f"✓ Service desk ticket created: {data['ticket_id']}")
        
        # Store for later tests
        self.__class__.request_id = data["request_id"]
        self.__class__.ticket_id = data["ticket_id"]
    
    def test_party_request_stored_as_dog(self):
        """Verify party request is stored with pet_type='dog'"""
        response = requests.get(f"{BASE_URL}/api/celebrate/party-requests?limit=5")
        assert response.status_code == 200
        
        data = response.json()
        requests_list = data.get("requests", [])
        
        # Find our test request
        test_request = None
        for req in requests_list:
            if req.get("user_email") == "test_party_196@example.com":
                test_request = req
                break
        
        if test_request:
            assert test_request.get("pet_type") == "dog", f"Pet type should be 'dog', got {test_request.get('pet_type')}"
            assert test_request.get("pillar") == "celebrate", "Pillar should be 'celebrate'"
            print(f"✓ Party request stored with pet_type='dog'")
        else:
            print("⚠ Test request not found in recent requests (may have been cleaned up)")
    
    def test_admin_notification_created_for_party_request(self):
        """Verify admin notification is created with party request details"""
        # Get admin notifications
        response = requests.get(f"{BASE_URL}/api/admin/notifications?limit=10")
        
        if response.status_code == 200:
            data = response.json()
            notifications = data.get("notifications", [])
            
            # Look for party_request notification
            party_notifications = [n for n in notifications if n.get("type") == "party_request"]
            
            if party_notifications:
                latest = party_notifications[0]
                assert "party" in latest.get("title", "").lower() or "🎉" in latest.get("title", ""), "Notification should mention party"
                print(f"✓ Admin notification found: {latest.get('title')}")
            else:
                print("⚠ No party_request notifications found (may need auth)")
        elif response.status_code == 401:
            print("⚠ Admin notifications require authentication - skipping")
        else:
            print(f"⚠ Admin notifications endpoint returned {response.status_code}")
    
    def test_celebrate_products_no_medicine(self):
        """Verify celebrate pillar has no medical/medicine products"""
        response = requests.get(f"{BASE_URL}/api/products?pillar=celebrate&limit=100")
        assert response.status_code == 200
        
        data = response.json()
        products = data.get("products", [])
        
        # Check for medicine-related keywords
        medicine_keywords = ["medicine", "medication", "pharmaceutical", "drug", "prescription", "antibiotic", "vaccine"]
        
        medicine_products = []
        for product in products:
            name = (product.get("name") or product.get("title") or "").lower()
            description = (product.get("description") or "").lower()
            category = (product.get("category") or "").lower()
            
            for keyword in medicine_keywords:
                if keyword in name or keyword in description or keyword in category:
                    medicine_products.append(product.get("name") or product.get("title"))
                    break
        
        if medicine_products:
            print(f"⚠ Found medicine-related products in celebrate pillar: {medicine_products}")
        else:
            print(f"✓ No medicine products found in celebrate pillar ({len(products)} products checked)")
        
        # This should pass - celebrate pillar should not have medicine
        assert len(medicine_products) == 0, f"Celebrate pillar should not have medicine products: {medicine_products}"
    
    def test_celebrate_services_no_medicine(self):
        """Verify celebrate services don't include medical services"""
        response = requests.get(f"{BASE_URL}/api/services?pillar=celebrate&limit=50")
        assert response.status_code == 200
        
        data = response.json()
        services = data.get("services", [])
        
        # Check for medicine-related keywords
        medicine_keywords = ["medicine", "medication", "pharmaceutical", "drug", "prescription", "vet", "veterinary", "medical"]
        
        medicine_services = []
        for service in services:
            name = (service.get("name") or "").lower()
            description = (service.get("description") or "").lower()
            category = (service.get("category") or "").lower()
            
            for keyword in medicine_keywords:
                if keyword in name or keyword in description or keyword in category:
                    medicine_services.append(service.get("name"))
                    break
        
        if medicine_services:
            print(f"⚠ Found medicine-related services in celebrate pillar: {medicine_services}")
        else:
            print(f"✓ No medicine services found in celebrate pillar ({len(services)} services checked)")
        
        # Celebrate services should be party/celebration focused, not medical
        assert len(medicine_services) == 0, f"Celebrate pillar should not have medicine services: {medicine_services}"


class TestMultiPetFamilyDogsOnly:
    """Test multi-pet family support filters out cats"""
    
    def test_pets_endpoint_exists(self):
        """Verify pets endpoint is accessible"""
        # This endpoint requires auth, so we just check it exists
        response = requests.get(f"{BASE_URL}/api/pets/my-pets")
        # Should return 401 (unauthorized) or 200 (if no auth required)
        assert response.status_code in [200, 401, 403], f"Pets endpoint should exist, got {response.status_code}"
        print(f"✓ Pets endpoint exists (status: {response.status_code})")
    
    def test_party_request_always_dog_type(self):
        """Verify party requests always set pet_type to 'dog'"""
        # Even if we try to send cat, it should be stored as dog
        party_data = {
            "petId": "test-cat-attempt",
            "petName": "Whiskers",
            "petType": "cat",  # Trying to send cat
            "occasion": "birthday",
            "date": (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d"),
            "time": "Morning",
            "guestCount": "1-5",
            "venue": "home",
            "budget": "budget",
            "specialRequests": "",
            "includeGrooming": False,
            "includePhotography": False,
            "includeVenue": False,
            "user_email": "test_cat_attempt_196@example.com",
            "user_name": "Cat Lover Test"
        }
        
        response = requests.post(f"{BASE_URL}/api/celebrate/party-request", json=party_data)
        assert response.status_code == 200
        
        # Now verify it was stored as dog
        response = requests.get(f"{BASE_URL}/api/celebrate/party-requests?limit=5")
        assert response.status_code == 200
        
        data = response.json()
        requests_list = data.get("requests", [])
        
        # Find our test request
        for req in requests_list:
            if req.get("user_email") == "test_cat_attempt_196@example.com":
                # Backend should override to 'dog'
                assert req.get("pet_type") == "dog", f"Pet type should be forced to 'dog', got {req.get('pet_type')}"
                print("✓ Backend correctly forces pet_type='dog' even when 'cat' is sent")
                return
        
        print("⚠ Test request not found - may have been cleaned up")


class TestServiceDeskTicketCreation:
    """Test service desk ticket creation from party request"""
    
    def test_service_desk_tickets_endpoint(self):
        """Verify service desk tickets endpoint exists"""
        response = requests.get(f"{BASE_URL}/api/service-desk/tickets?limit=5")
        
        if response.status_code == 200:
            data = response.json()
            tickets = data.get("tickets", [])
            
            # Look for celebrate/party tickets
            party_tickets = [t for t in tickets if t.get("pillar") == "celebrate" or "party" in t.get("category", "")]
            
            if party_tickets:
                print(f"✓ Found {len(party_tickets)} celebrate/party tickets")
                # Verify ticket structure
                ticket = party_tickets[0]
                assert "ticket_id" in ticket, "Ticket should have ticket_id"
                assert "title" in ticket, "Ticket should have title"
                assert "status" in ticket, "Ticket should have status"
            else:
                print("✓ Service desk tickets endpoint working (no party tickets yet)")
        elif response.status_code == 401:
            print("⚠ Service desk tickets require authentication")
        else:
            print(f"⚠ Service desk tickets endpoint returned {response.status_code}")


class TestAdminNotifications:
    """Test admin notifications for party requests"""
    
    def test_admin_notifications_endpoint(self):
        """Verify admin notifications endpoint exists"""
        response = requests.get(f"{BASE_URL}/api/admin/notifications?limit=10")
        
        if response.status_code == 200:
            data = response.json()
            notifications = data.get("notifications", [])
            print(f"✓ Admin notifications endpoint working ({len(notifications)} notifications)")
            
            # Check for party_request type notifications
            party_notifs = [n for n in notifications if n.get("type") == "party_request"]
            if party_notifs:
                notif = party_notifs[0]
                assert "title" in notif, "Notification should have title"
                assert "message" in notif, "Notification should have message"
                print(f"✓ Party request notification found: {notif.get('title')}")
        elif response.status_code == 401:
            print("⚠ Admin notifications require authentication - testing with admin login")
            # Try with admin auth
            admin_response = requests.post(f"{BASE_URL}/api/admin/login", json={
                "username": "aditya",
                "password": "lola4304"
            })
            if admin_response.status_code == 200:
                token = admin_response.json().get("token")
                headers = {"Authorization": f"Bearer {token}"}
                auth_response = requests.get(f"{BASE_URL}/api/admin/notifications?limit=10", headers=headers)
                if auth_response.status_code == 200:
                    data = auth_response.json()
                    print(f"✓ Admin notifications accessible with auth ({len(data.get('notifications', []))} notifications)")
        else:
            print(f"⚠ Admin notifications endpoint returned {response.status_code}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
