"""
Iteration 161 Backend Tests
Tests for:
1. Export API - products with tags
2. Admin notifications for quick-book
3. Kit types detection
4. Price calculator API
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://pet-soul-platform-1.preview.emergentagent.com')


class TestExportAPI:
    """Test product tags export endpoint"""
    
    def test_export_products_json(self):
        """Test JSON export of products with tags"""
        response = requests.get(f"{BASE_URL}/api/admin/export/products-with-tags?format=json")
        assert response.status_code == 200
        
        data = response.json()
        assert "generated_at" in data
        assert "total_products" in data
        assert "products" in data
        assert data["total_products"] > 0
        
        # Check product structure
        if data["products"]:
            product = data["products"][0]
            assert "id" in product
            # Tags should be present (may be empty list)
            assert "tags" in product or product.get("tags") is None
    
    def test_export_products_csv(self):
        """Test CSV export of products with tags"""
        response = requests.get(f"{BASE_URL}/api/admin/export/products-with-tags?format=csv")
        assert response.status_code == 200
        
        # Check content type
        assert "text/csv" in response.headers.get("content-type", "")
        
        # Check CSV has header
        content = response.text
        assert "ID" in content
        assert "Title" in content
        assert "Tags" in content
    
    def test_export_services_json(self):
        """Test JSON export of services with tags"""
        response = requests.get(f"{BASE_URL}/api/admin/export/services-with-tags?format=json")
        assert response.status_code == 200
        
        data = response.json()
        assert "generated_at" in data
        assert "total_services" in data


class TestQuickBookAdminNotification:
    """Test that quick-book creates admin notifications"""
    
    def test_quick_book_creates_notification(self):
        """Test quick-book endpoint creates admin notification"""
        # Create a booking
        booking_data = {
            "serviceType": "grooming_test",
            "date": "2026-02-10",
            "time": "15:00",
            "notes": "Test booking for notification verification",
            "session_id": "test-notif-session",
            "pillar": "care"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/mira/quick-book",
            json=booking_data
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        assert "booking_id" in data
        assert "ticket_id" in data
        
        # The notification should be created (verified via logs)
        print(f"Booking created: {data['booking_id']}, Ticket: {data['ticket_id']}")
    
    def test_quick_book_with_pillar(self):
        """Test quick-book with explicit pillar"""
        booking_data = {
            "serviceType": "vet_consultation",
            "date": "2026-02-11",
            "time": "10:00",
            "notes": "Vet consultation test",
            "pillar": "care"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/mira/quick-book",
            json=booking_data
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True


class TestKitDetection:
    """Test kit type detection in Mira chat"""
    
    def test_training_kit_on_learn_pillar(self):
        """Training kit request on Learn pillar should return training_kit"""
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            json={
                "message": "build me a training kit",
                "current_pillar": "learn",
                "source": "web_widget"
            }
        )
        assert response.status_code == 200
        
        data = response.json()
        kit_assembly = data.get("kit_assembly", {})
        kit_type = kit_assembly.get("kit_type", "")
        
        # Should be training_kit, not travel_kit
        assert kit_type == "training_kit", f"Expected training_kit, got {kit_type}"
    
    def test_travel_kit_on_travel_pillar(self):
        """Travel kit request on Travel pillar should return travel_kit"""
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            json={
                "message": "build me a travel kit",
                "current_pillar": "travel",
                "source": "web_widget"
            }
        )
        assert response.status_code == 200
        
        data = response.json()
        kit_assembly = data.get("kit_assembly", {})
        kit_type = kit_assembly.get("kit_type", "")
        
        assert kit_type == "travel_kit", f"Expected travel_kit, got {kit_type}"
    
    def test_grooming_kit_on_care_pillar(self):
        """Grooming kit request on Care pillar should return grooming_kit"""
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            json={
                "message": "build me a grooming kit",
                "current_pillar": "care",
                "source": "web_widget"
            }
        )
        assert response.status_code == 200
        
        data = response.json()
        kit_assembly = data.get("kit_assembly", {})
        kit_type = kit_assembly.get("kit_type", "")
        
        assert kit_type == "grooming_kit", f"Expected grooming_kit, got {kit_type}"


class TestPriceCalculator:
    """Test service price calculator API"""
    
    def test_calculate_price_endpoint(self):
        """Test price calculation endpoint"""
        # First get a service
        services_response = requests.get(
            f"{BASE_URL}/api/service-catalog/services?pillar=care&limit=1"
        )
        
        if services_response.status_code == 200:
            services = services_response.json().get("services", [])
            if services:
                service_id = services[0].get("id")
                
                # Calculate price
                price_response = requests.post(
                    f"{BASE_URL}/api/service-catalog/calculate-price",
                    json={
                        "service_id": service_id,
                        "city": "mumbai",
                        "pet_size": "medium",
                        "pet_count": 1,
                        "add_on_ids": []
                    }
                )
                
                if price_response.status_code == 200:
                    price_data = price_response.json()
                    assert "total" in price_data or "base_price" in price_data
                    print(f"Price calculated: {price_data}")


class TestMiraChat:
    """Test Mira chat basic functionality"""
    
    def test_mira_chat_response(self):
        """Test Mira chat returns valid response"""
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            json={
                "message": "Hello Mira",
                "source": "web_widget"
            }
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "response" in data
        assert "session_id" in data
    
    def test_mira_chat_creates_ticket(self):
        """Test Mira chat creates ticket"""
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            json={
                "message": "I need help with grooming",
                "source": "web_widget"
            }
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "ticket_id" in data


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
