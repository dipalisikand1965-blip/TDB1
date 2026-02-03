"""
Travel Page Features Tests - Iteration 207
Tests for Travel page improvements and polish

Features tested:
1. POST /api/travel/request creates service desk ticket with unified flow
2. Travel types endpoint returns all 4 types
3. Travel bundles endpoint
4. Travel products endpoint
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestTravelRequestAPI:
    """Test travel request endpoint with unified flow"""
    
    def test_travel_request_cab_type(self):
        """Test cab travel request creates ticket with unified flow IDs"""
        response = requests.post(f"{BASE_URL}/api/travel/request", json={
            "travel_type": "cab",
            "pet_name": "TEST_Buddy",
            "pet_breed": "Golden Retriever",
            "pickup_city": "Mumbai",
            "drop_city": "Pune",
            "travel_date": "2026-02-20",
            "travel_time": "10:00",
            "user_name": "Test User",
            "user_email": "test@example.com",
            "user_phone": "9876543210"
        })
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify unified flow IDs
        assert data.get("success") == True
        assert "request_id" in data or "ticket_id" in data
        assert "notification_id" in data
        assert "inbox_id" in data
        assert data.get("status") == "submitted"
        print(f"✅ Cab request created: {data.get('ticket_id')}")
    
    def test_travel_request_flight_type(self):
        """Test flight travel request creates ticket with unified flow IDs"""
        response = requests.post(f"{BASE_URL}/api/travel/request", json={
            "travel_type": "flight",
            "pet_name": "TEST_Max",
            "pet_breed": "Beagle",
            "pickup_city": "Delhi",
            "drop_city": "Bangalore",
            "travel_date": "2026-03-01",
            "travel_time": "08:00",
            "user_name": "Flight Test User",
            "user_email": "flight@example.com",
            "user_phone": "9876543211",
            "pet_weight": 12,
            "crate_trained": True
        })
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify unified flow IDs
        assert data.get("success") == True
        assert "ticket_id" in data
        assert "notification_id" in data
        assert "inbox_id" in data
        print(f"✅ Flight request created: {data.get('ticket_id')}")
    
    def test_travel_request_train_type(self):
        """Test train travel request creates ticket with unified flow IDs"""
        response = requests.post(f"{BASE_URL}/api/travel/request", json={
            "travel_type": "train",
            "pet_name": "TEST_Rocky",
            "pet_breed": "German Shepherd",
            "pickup_city": "Chennai",
            "drop_city": "Ooty",
            "travel_date": "2026-02-25",
            "travel_time": "06:00",
            "user_name": "Train Test User",
            "user_email": "train@example.com"
        })
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify unified flow IDs
        assert data.get("success") == True
        assert "ticket_id" in data
        assert "notification_id" in data
        assert "inbox_id" in data
        print(f"✅ Train request created: {data.get('ticket_id')}")
    
    def test_travel_request_relocation_type(self):
        """Test relocation travel request creates ticket with unified flow IDs"""
        response = requests.post(f"{BASE_URL}/api/travel/request", json={
            "travel_type": "relocation",
            "pet_name": "TEST_Luna",
            "pet_breed": "French Bulldog",
            "pickup_city": "Bangalore",
            "drop_city": "Dubai",
            "travel_date": "2026-04-01",
            "user_name": "Relocation Test User",
            "user_email": "relocation@example.com",
            "special_requirements": "International relocation with all paperwork"
        })
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify unified flow IDs
        assert data.get("success") == True
        assert "ticket_id" in data
        assert "notification_id" in data
        assert "inbox_id" in data
        print(f"✅ Relocation request created: {data.get('ticket_id')}")


class TestTravelTypesAPI:
    """Test travel types endpoint"""
    
    def test_get_travel_types(self):
        """Test GET /api/travel/types returns all 4 travel types"""
        response = requests.get(f"{BASE_URL}/api/travel/types")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "travel_types" in data
        travel_types = data["travel_types"]
        
        # Verify all 4 types exist
        expected_types = ["cab", "train", "flight", "relocation"]
        for travel_type in expected_types:
            assert travel_type in travel_types, f"Missing travel type: {travel_type}"
            print(f"✅ Travel type '{travel_type}' found: {travel_types[travel_type]['name']}")


class TestTravelBundlesAPI:
    """Test travel bundles endpoint"""
    
    def test_get_travel_bundles(self):
        """Test GET /api/travel/bundles returns bundles"""
        response = requests.get(f"{BASE_URL}/api/travel/bundles")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "bundles" in data
        bundles = data["bundles"]
        print(f"✅ Found {len(bundles)} travel bundles")
        
        # Verify bundle structure if bundles exist
        if len(bundles) > 0:
            bundle = bundles[0]
            assert "name" in bundle
            assert "price" in bundle
            print(f"  First bundle: {bundle.get('name')} - ₹{bundle.get('price')}")


class TestTravelProductsAPI:
    """Test travel products endpoint"""
    
    def test_get_travel_products(self):
        """Test GET /api/products?pillar=travel returns travel products"""
        response = requests.get(f"{BASE_URL}/api/products", params={"pillar": "travel", "limit": 10})
        
        assert response.status_code == 200
        data = response.json()
        
        assert "products" in data
        products = data["products"]
        print(f"✅ Found {len(products)} travel products")
        
        # Verify products are travel pillar
        for product in products[:3]:
            assert product.get("pillar") == "travel", f"Product {product.get('name')} is not travel pillar"
            print(f"  Product: {product.get('name')}")


class TestHealthEndpoint:
    """Test health endpoint"""
    
    def test_health_check(self):
        """Test health endpoint returns healthy status"""
        response = requests.get(f"{BASE_URL}/api/health")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data.get("status") == "healthy"
        print("✅ Health check passed")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
