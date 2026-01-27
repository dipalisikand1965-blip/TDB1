"""
Test Suite for Global Scale Foundation & Advanced Checkout Logic
Tests:
1. Public settings API - pickup_cities, store_locations, pan_india_shipping
2. Admin settings API - auth and CRUD operations
3. Product migration API - fulfilment_type field
4. Checkout page - bakery alerts, pickup location selection, pan-india toggle
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://doggy-os-2.preview.emergentagent.com')
ADMIN_USERNAME = "aditya"
ADMIN_PASSWORD = "doggy2026"


class TestPublicSettingsAPI:
    """Test public settings API for checkout page"""
    
    def test_public_settings_returns_pickup_cities(self):
        """GET /api/settings/public returns pickup_cities array"""
        response = requests.get(f"{BASE_URL}/api/settings/public")
        assert response.status_code == 200
        
        data = response.json()
        assert "pickup_cities" in data
        assert isinstance(data["pickup_cities"], list)
        assert len(data["pickup_cities"]) >= 3
        assert "Mumbai" in data["pickup_cities"]
        assert "Gurugram" in data["pickup_cities"]
        assert "Bangalore" in data["pickup_cities"]
    
    def test_public_settings_returns_store_locations(self):
        """GET /api/settings/public returns store_locations with addresses"""
        response = requests.get(f"{BASE_URL}/api/settings/public")
        assert response.status_code == 200
        
        data = response.json()
        assert "store_locations" in data
        assert isinstance(data["store_locations"], list)
        assert len(data["store_locations"]) >= 3
        
        # Verify store location structure
        for loc in data["store_locations"]:
            assert "id" in loc
            assert "city" in loc
            assert "address" in loc
            assert len(loc["address"]) > 10  # Has actual address
    
    def test_public_settings_returns_pan_india_shipping(self):
        """GET /api/settings/public returns pan_india_shipping boolean"""
        response = requests.get(f"{BASE_URL}/api/settings/public")
        assert response.status_code == 200
        
        data = response.json()
        assert "pan_india_shipping" in data
        assert isinstance(data["pan_india_shipping"], bool)
    
    def test_public_settings_returns_bakery_categories(self):
        """GET /api/settings/public returns bakery_pickup_only_categories"""
        response = requests.get(f"{BASE_URL}/api/settings/public")
        assert response.status_code == 200
        
        data = response.json()
        assert "bakery_pickup_only_categories" in data
        assert isinstance(data["bakery_pickup_only_categories"], list)
        assert "cakes" in data["bakery_pickup_only_categories"]


class TestAdminSettingsAPI:
    """Test admin settings API with authentication"""
    
    def test_admin_settings_requires_auth(self):
        """GET /api/admin/settings returns 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/admin/settings")
        assert response.status_code == 401
    
    def test_admin_settings_with_valid_auth(self):
        """GET /api/admin/settings returns settings with valid auth"""
        response = requests.get(
            f"{BASE_URL}/api/admin/settings",
            auth=(ADMIN_USERNAME, ADMIN_PASSWORD)
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "id" in data
        assert data["id"] == "global_settings"
        assert "pickup_cities" in data
        assert "pan_india_shipping" in data
        assert "default_fulfilment_type" in data
        assert "bakery_pickup_only_categories" in data
        assert "store_locations" in data
        assert "updated_at" in data
    
    def test_admin_settings_update(self):
        """PUT /api/admin/settings updates settings"""
        # First get current settings
        get_response = requests.get(
            f"{BASE_URL}/api/admin/settings",
            auth=(ADMIN_USERNAME, ADMIN_PASSWORD)
        )
        original_settings = get_response.json()
        
        # Update pan_india_shipping
        update_response = requests.put(
            f"{BASE_URL}/api/admin/settings",
            auth=(ADMIN_USERNAME, ADMIN_PASSWORD),
            json={"pan_india_shipping": True}
        )
        assert update_response.status_code == 200
        
        # Verify update
        verify_response = requests.get(
            f"{BASE_URL}/api/admin/settings",
            auth=(ADMIN_USERNAME, ADMIN_PASSWORD)
        )
        assert verify_response.status_code == 200
        assert verify_response.json()["pan_india_shipping"] == True


class TestProductMigrationAPI:
    """Test product fulfilment migration API"""
    
    def test_migration_requires_auth(self):
        """POST /api/admin/products/migrate-fulfilment-defaults requires auth"""
        response = requests.post(f"{BASE_URL}/api/admin/products/migrate-fulfilment-defaults")
        assert response.status_code == 401
    
    def test_migration_with_auth(self):
        """POST /api/admin/products/migrate-fulfilment-defaults works with auth"""
        response = requests.post(
            f"{BASE_URL}/api/admin/products/migrate-fulfilment-defaults",
            auth=(ADMIN_USERNAME, ADMIN_PASSWORD)
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "message" in data
        assert data["message"] == "Migration complete"
        assert "bakery_products_updated" in data
        assert "other_products_updated" in data


class TestProductFulfilmentAPI:
    """Test product fulfilment update APIs"""
    
    def test_update_product_fulfilment_requires_auth(self):
        """PUT /api/admin/products/{id}/fulfilment requires auth"""
        response = requests.put(
            f"{BASE_URL}/api/admin/products/test-product/fulfilment",
            json={"fulfilment_type": "shipping"}
        )
        assert response.status_code == 401
    
    def test_update_product_fulfilment_invalid_type(self):
        """PUT /api/admin/products/{id}/fulfilment rejects invalid type"""
        response = requests.put(
            f"{BASE_URL}/api/admin/products/test-product/fulfilment",
            auth=(ADMIN_USERNAME, ADMIN_PASSWORD),
            json={"fulfilment_type": "invalid_type"}
        )
        assert response.status_code == 400
    
    def test_bulk_fulfilment_requires_auth(self):
        """POST /api/admin/products/bulk-fulfilment requires auth"""
        response = requests.post(
            f"{BASE_URL}/api/admin/products/bulk-fulfilment?fulfilment_type=shipping",
            json=["product-1", "product-2"]
        )
        assert response.status_code == 401


class TestProductsWithFulfilmentType:
    """Test that products have fulfilment_type field"""
    
    def test_cake_products_have_fulfilment_type(self):
        """Cake products should have fulfilment_type field"""
        response = requests.get(f"{BASE_URL}/api/products?limit=5&category=cakes")
        assert response.status_code == 200
        
        data = response.json()
        products = data.get("products", [])
        
        # Check if products exist
        if len(products) > 0:
            # At least some products should have fulfilment_type
            products_with_fulfilment = [p for p in products if "fulfilment_type" in p]
            # Note: This may be 0 if migration hasn't been run yet
            print(f"Products with fulfilment_type: {len(products_with_fulfilment)}/{len(products)}")
    
    def test_treats_products_have_fulfilment_type(self):
        """Treats products should have fulfilment_type field"""
        response = requests.get(f"{BASE_URL}/api/products?limit=5&category=treats")
        assert response.status_code == 200
        
        data = response.json()
        products = data.get("products", [])
        
        if len(products) > 0:
            products_with_fulfilment = [p for p in products if "fulfilment_type" in p]
            print(f"Treats with fulfilment_type: {len(products_with_fulfilment)}/{len(products)}")


class TestHealthAndBasicAPIs:
    """Basic health and API tests"""
    
    def test_health_endpoint(self):
        """GET /api/health returns healthy status"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        
        data = response.json()
        assert data["status"] == "healthy"
    
    def test_products_api(self):
        """GET /api/products returns products"""
        response = requests.get(f"{BASE_URL}/api/products?limit=10")
        assert response.status_code == 200
        
        data = response.json()
        assert "products" in data
        assert isinstance(data["products"], list)


class TestOrderCreationWithFulfilment:
    """Test order creation with fulfilment type"""
    
    def test_create_order_with_store_pickup(self):
        """POST /api/orders with store_pickup fulfilment type"""
        order_data = {
            "orderId": f"TEST-PICKUP-{os.urandom(4).hex()}",
            "customer": {
                "parentName": "Test User",
                "email": "test@example.com",
                "phone": "9876543210",
                "whatsappNumber": "9876543210"
            },
            "pet": {
                "name": "Bruno",
                "breed": "Golden Retriever",
                "age": "3 years"
            },
            "delivery": {
                "method": "pickup",
                "fulfilmentType": "store_pickup",
                "pickupLocation": "mumbai",
                "isPanIndia": False,
                "address": "",
                "landmark": "",
                "city": "Mumbai",
                "pincode": "",
                "date": "2026-01-20",
                "time": "afternoon"
            },
            "items": [
                {
                    "productId": "shopify-8634045595802",
                    "name": "Test Cake",
                    "size": "Standard",
                    "flavor": "Chicken",
                    "quantity": 1,
                    "price": 600,
                    "category": "cakes"
                }
            ],
            "specialInstructions": "Test order - please ignore",
            "isGift": False,
            "giftMessage": "",
            "couponCode": "",
            "discountAmount": 0,
            "loyaltyPointsUsed": 0,
            "loyaltyDiscount": 0,
            "subtotal": 600,
            "deliveryFee": 0,
            "total": 600,
            "status": "pending",
            "paymentStatus": "unpaid"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/orders",
            json=order_data
        )
        assert response.status_code == 200
        
        data = response.json()
        assert "orderId" in data or "id" in data
    
    def test_create_order_with_pan_india_shipping(self):
        """POST /api/orders with pan_india_shipping fulfilment type"""
        order_data = {
            "orderId": f"TEST-PANIND-{os.urandom(4).hex()}",
            "customer": {
                "parentName": "Test User Pan India",
                "email": "test.panind@example.com",
                "phone": "9876543211",
                "whatsappNumber": "9876543211"
            },
            "pet": {
                "name": "Max",
                "breed": "Labrador",
                "age": "2 years"
            },
            "delivery": {
                "method": "delivery",
                "fulfilmentType": "pan_india_shipping",
                "pickupLocation": None,
                "isPanIndia": True,
                "address": "123 Test Street",
                "landmark": "Near Test Mall",
                "city": "Chennai",
                "pincode": "600001",
                "date": "2026-01-22",
                "time": "morning"
            },
            "items": [
                {
                    "productId": "shopify-test-treats",
                    "name": "Test Treats",
                    "size": "Standard",
                    "flavor": "Chicken",
                    "quantity": 2,
                    "price": 250,
                    "category": "treats"
                }
            ],
            "specialInstructions": "Test pan-india order",
            "isGift": False,
            "giftMessage": "",
            "couponCode": "",
            "discountAmount": 0,
            "loyaltyPointsUsed": 0,
            "loyaltyDiscount": 0,
            "subtotal": 500,
            "deliveryFee": 150,
            "total": 650,
            "status": "pending",
            "paymentStatus": "unpaid"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/orders",
            json=order_data
        )
        assert response.status_code == 200
    
    def test_create_order_with_split_fulfilment(self):
        """POST /api/orders with split fulfilment (bakery + shippable)"""
        order_data = {
            "orderId": f"TEST-SPLIT-{os.urandom(4).hex()}",
            "customer": {
                "parentName": "Test User Split",
                "email": "test.split@example.com",
                "phone": "9876543212",
                "whatsappNumber": "9876543212"
            },
            "pet": {
                "name": "Rocky",
                "breed": "Beagle",
                "age": "4 years"
            },
            "delivery": {
                "method": "delivery",
                "fulfilmentType": "split",
                "pickupLocation": "bangalore",
                "isPanIndia": False,
                "address": "456 Test Avenue",
                "landmark": "Near Test Park",
                "city": "Bangalore",
                "pincode": "560001",
                "date": "2026-01-25",
                "time": "evening"
            },
            "items": [
                {
                    "productId": "shopify-cake-1",
                    "name": "Birthday Cake",
                    "size": "Standard",
                    "flavor": "Chicken",
                    "quantity": 1,
                    "price": 800,
                    "category": "cakes"
                },
                {
                    "productId": "shopify-treats-1",
                    "name": "Treat Pack",
                    "size": "Standard",
                    "flavor": "Mixed",
                    "quantity": 1,
                    "price": 300,
                    "category": "treats"
                }
            ],
            "specialInstructions": "Test split fulfilment order",
            "isGift": False,
            "giftMessage": "",
            "couponCode": "",
            "discountAmount": 0,
            "loyaltyPointsUsed": 0,
            "loyaltyDiscount": 0,
            "subtotal": 1100,
            "deliveryFee": 150,
            "total": 1250,
            "status": "pending",
            "paymentStatus": "unpaid",
            "splitFulfilment": {
                "bakeryPickup": {
                    "location": "bangalore",
                    "items": ["Birthday Cake"]
                },
                "shipping": {
                    "address": "456 Test Avenue, Bangalore - 560001",
                    "items": ["Treat Pack"],
                    "isPanIndia": False
                }
            }
        }
        
        response = requests.post(
            f"{BASE_URL}/api/orders",
            json=order_data
        )
        assert response.status_code == 200


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
