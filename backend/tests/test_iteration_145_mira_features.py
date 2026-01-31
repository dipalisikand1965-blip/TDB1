"""
Iteration 145: Mira AI Features Testing
- Cart event listener (addToCart custom event)
- Grooming kit returns products + services + concierge-sourced items
- Concierge-sourced items have concierge_sourced=true and in_stock=false
- Services have is_service=true and service_type field
- Kit assembly returns kit_assembly.kit_type and can_add_all_to_cart
- Quick book endpoint works for service bookings
"""
import pytest
import requests
import os
import json

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestMiraGroomingKit:
    """Test grooming kit returns products + services + concierge-sourced items"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token"""
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "dipali@clubconcierge.in",
            "password": "test123"
        })
        if login_response.status_code == 200:
            self.token = login_response.json().get("token")
            self.headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.token}"
            }
        else:
            self.token = None
            self.headers = {"Content-Type": "application/json"}
    
    def test_api_health(self):
        """Test API is healthy"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        print("✅ API health check passed")
    
    def test_grooming_kit_request(self):
        """Test grooming kit returns products + services + concierge items"""
        response = requests.post(f"{BASE_URL}/api/mira/chat", 
            headers=self.headers,
            json={
                "message": "I need a grooming kit for my dog",
                "session_id": "test-grooming-kit-145",
                "source": "test"
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        # Check kit_assembly structure
        kit_assembly = data.get("kit_assembly")
        assert kit_assembly is not None, "kit_assembly should be present"
        assert kit_assembly.get("is_kit") == True, "is_kit should be True"
        assert kit_assembly.get("kit_type") == "grooming_kit", f"kit_type should be grooming_kit, got {kit_assembly.get('kit_type')}"
        assert kit_assembly.get("can_add_all_to_cart") == True, "can_add_all_to_cart should be True"
        
        print(f"✅ Kit assembly: is_kit={kit_assembly.get('is_kit')}, kit_type={kit_assembly.get('kit_type')}, can_add_all_to_cart={kit_assembly.get('can_add_all_to_cart')}")
        
        # Check products returned
        products = data.get("products", [])
        assert len(products) > 0, "Should return products"
        
        # Categorize products
        in_stock_products = [p for p in products if p.get("in_stock") == True and not p.get("is_service")]
        concierge_sourced = [p for p in products if p.get("concierge_sourced") == True]
        services = [p for p in products if p.get("is_service") == True]
        
        print(f"✅ Products breakdown: {len(in_stock_products)} in-stock, {len(concierge_sourced)} concierge-sourced, {len(services)} services")
        print(f"   Total: {len(products)} items")
        
        # Verify services have required fields
        for service in services:
            assert service.get("is_service") == True, f"Service {service.get('name')} should have is_service=True"
            assert service.get("service_type") is not None, f"Service {service.get('name')} should have service_type"
            print(f"   ✅ Service: {service.get('name')} - service_type={service.get('service_type')}")
        
        # Verify concierge-sourced items have required fields
        for item in concierge_sourced:
            assert item.get("concierge_sourced") == True, f"Item {item.get('name')} should have concierge_sourced=True"
            assert item.get("in_stock") == False, f"Item {item.get('name')} should have in_stock=False"
            print(f"   ✅ Concierge-sourced: {item.get('name')} - in_stock={item.get('in_stock')}")
    
    def test_concierge_sourced_item_structure(self):
        """Test concierge-sourced items have correct structure"""
        response = requests.post(f"{BASE_URL}/api/mira/chat", 
            headers=self.headers,
            json={
                "message": "I need a grooming kit with nail clipper and ear cleaner",
                "session_id": "test-concierge-items-145",
                "source": "test"
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        products = data.get("products", [])
        concierge_items = [p for p in products if p.get("concierge_sourced") == True]
        
        for item in concierge_items:
            # Verify structure
            assert "id" in item, "Concierge item should have id"
            assert "name" in item, "Concierge item should have name"
            assert item.get("concierge_sourced") == True
            assert item.get("in_stock") == False
            assert item.get("price") is None, "Concierge item price should be None (TBD)"
            print(f"✅ Concierge item structure valid: {item.get('name')}")
    
    def test_service_item_structure(self):
        """Test service items have correct structure"""
        response = requests.post(f"{BASE_URL}/api/mira/chat", 
            headers=self.headers,
            json={
                "message": "I need grooming services for my dog",
                "session_id": "test-service-items-145",
                "source": "test"
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        products = data.get("products", [])
        services = [p for p in products if p.get("is_service") == True]
        
        assert len(services) > 0, "Should return services for grooming request"
        
        for service in services:
            # Verify structure
            assert "id" in service, "Service should have id"
            assert "name" in service, "Service should have name"
            assert service.get("is_service") == True
            assert service.get("service_type") is not None
            assert service.get("kit_category") == "service"
            print(f"✅ Service structure valid: {service.get('name')} - type={service.get('service_type')}")


class TestQuickBookEndpoint:
    """Test quick book endpoint for service bookings"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token"""
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "dipali@clubconcierge.in",
            "password": "test123"
        })
        if login_response.status_code == 200:
            self.token = login_response.json().get("token")
            self.headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.token}"
            }
        else:
            self.token = None
            self.headers = {"Content-Type": "application/json"}
    
    def test_quick_book_grooming(self):
        """Test quick book for grooming service"""
        response = requests.post(f"{BASE_URL}/api/mira/quick-book",
            headers=self.headers,
            json={
                "date": "2026-02-15",
                "time": "10:00",
                "notes": "Full grooming session",
                "serviceType": "full_grooming",
                "session_id": "test-quick-book-grooming-145"
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "booking_id" in data, "Should return booking_id"
        assert "ticket_id" in data, "Should return ticket_id"
        assert data.get("status") == "pending"
        
        print(f"✅ Quick book grooming: booking_id={data.get('booking_id')}, ticket_id={data.get('ticket_id')}")
    
    def test_quick_book_vet(self):
        """Test quick book for vet service"""
        response = requests.post(f"{BASE_URL}/api/mira/quick-book",
            headers=self.headers,
            json={
                "date": "2026-02-16",
                "time": "11:00",
                "notes": "Annual checkup",
                "serviceType": "vet_consultation",
                "session_id": "test-quick-book-vet-145"
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "booking_id" in data
        assert "ticket_id" in data
        print(f"✅ Quick book vet: booking_id={data.get('booking_id')}, ticket_id={data.get('ticket_id')}")
    
    def test_quick_book_boarding(self):
        """Test quick book for boarding service"""
        response = requests.post(f"{BASE_URL}/api/mira/quick-book",
            headers=self.headers,
            json={
                "date": "2026-02-20",
                "time": "09:00",
                "notes": "Weekend boarding",
                "serviceType": "boarding",
                "session_id": "test-quick-book-boarding-145"
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "booking_id" in data
        assert "ticket_id" in data
        print(f"✅ Quick book boarding: booking_id={data.get('booking_id')}, ticket_id={data.get('ticket_id')}")


class TestShowQuickBookFormTrigger:
    """Test that service requests trigger show_quick_book_form=true"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token"""
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "dipali@clubconcierge.in",
            "password": "test123"
        })
        if login_response.status_code == 200:
            self.token = login_response.json().get("token")
            self.headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.token}"
            }
        else:
            self.token = None
            self.headers = {"Content-Type": "application/json"}
    
    def test_grooming_triggers_quick_book_form(self):
        """Test grooming request triggers show_quick_book_form"""
        response = requests.post(f"{BASE_URL}/api/mira/chat", 
            headers=self.headers,
            json={
                "message": "I want to book grooming for my dog",
                "session_id": "test-grooming-form-145",
                "source": "test"
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        concierge_action = data.get("concierge_action", {})
        assert concierge_action.get("show_quick_book_form") == True, "Grooming should trigger show_quick_book_form"
        print(f"✅ Grooming triggers quick book form: show_quick_book_form={concierge_action.get('show_quick_book_form')}")
    
    def test_vet_triggers_quick_book_form(self):
        """Test vet request triggers show_quick_book_form"""
        response = requests.post(f"{BASE_URL}/api/mira/chat", 
            headers=self.headers,
            json={
                "message": "I need to book a vet appointment",
                "session_id": "test-vet-form-145",
                "source": "test"
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        concierge_action = data.get("concierge_action", {})
        assert concierge_action.get("show_quick_book_form") == True, "Vet should trigger show_quick_book_form"
        print(f"✅ Vet triggers quick book form: show_quick_book_form={concierge_action.get('show_quick_book_form')}")
    
    def test_boarding_triggers_quick_book_form(self):
        """Test boarding request triggers show_quick_book_form"""
        response = requests.post(f"{BASE_URL}/api/mira/chat", 
            headers=self.headers,
            json={
                "message": "I need boarding for my dog next week",
                "session_id": "test-boarding-form-145",
                "source": "test"
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        concierge_action = data.get("concierge_action", {})
        assert concierge_action.get("show_quick_book_form") == True, "Boarding should trigger show_quick_book_form"
        print(f"✅ Boarding triggers quick book form: show_quick_book_form={concierge_action.get('show_quick_book_form')}")


class TestKitAssemblyResponse:
    """Test kit assembly response structure"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Login and get auth token"""
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "dipali@clubconcierge.in",
            "password": "test123"
        })
        if login_response.status_code == 200:
            self.token = login_response.json().get("token")
            self.headers = {
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.token}"
            }
        else:
            self.token = None
            self.headers = {"Content-Type": "application/json"}
    
    def test_travel_kit_assembly(self):
        """Test travel kit assembly response"""
        response = requests.post(f"{BASE_URL}/api/mira/chat", 
            headers=self.headers,
            json={
                "message": "I need a travel kit for my dog",
                "session_id": "test-travel-kit-145",
                "source": "test"
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        kit_assembly = data.get("kit_assembly")
        assert kit_assembly is not None
        assert kit_assembly.get("is_kit") == True
        assert kit_assembly.get("kit_type") == "travel_kit"
        assert kit_assembly.get("can_add_all_to_cart") == True
        assert kit_assembly.get("items_found") > 0
        
        print(f"✅ Travel kit: kit_type={kit_assembly.get('kit_type')}, items_found={kit_assembly.get('items_found')}")
    
    def test_birthday_kit_assembly(self):
        """Test birthday kit assembly response"""
        response = requests.post(f"{BASE_URL}/api/mira/chat", 
            headers=self.headers,
            json={
                "message": "I need a birthday kit for my dog's party",
                "session_id": "test-birthday-kit-145",
                "source": "test"
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        kit_assembly = data.get("kit_assembly")
        assert kit_assembly is not None
        assert kit_assembly.get("is_kit") == True
        assert kit_assembly.get("kit_type") == "birthday_kit"
        assert kit_assembly.get("can_add_all_to_cart") == True
        
        print(f"✅ Birthday kit: kit_type={kit_assembly.get('kit_type')}, items_found={kit_assembly.get('items_found')}")
    
    def test_health_kit_assembly(self):
        """Test health kit assembly response"""
        response = requests.post(f"{BASE_URL}/api/mira/chat", 
            headers=self.headers,
            json={
                "message": "I need a health kit for my dog",
                "session_id": "test-health-kit-145",
                "source": "test"
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        kit_assembly = data.get("kit_assembly")
        assert kit_assembly is not None
        assert kit_assembly.get("is_kit") == True
        assert kit_assembly.get("kit_type") == "health_kit"
        
        print(f"✅ Health kit: kit_type={kit_assembly.get('kit_type')}, items_found={kit_assembly.get('items_found')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
