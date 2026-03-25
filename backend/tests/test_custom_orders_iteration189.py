"""
Test Custom Order API + Mockup Routes for Iteration 189
Tests:
1. Custom Order API: POST /api/custom-orders creates order + service desk ticket
2. Custom Order API: GET /api/custom-orders lists orders
3. Custom Order API: GET /api/custom-orders/{order_id} gets single order
4. Custom Order API: PATCH /api/custom-orders/{order_id}/status updates order status
5. Photo Upload API: POST /api/custom-orders/upload-photo accepts multipart form data
6. Breed Products by Pillar: GET /api/mockups/breed-products?breed=labrador&pillar=celebrate
7. Admin Breed Products with pillar filter: GET /api/admin/breed-products?pillar=celebrate&breed=indie
8. Mockup Generation Status: GET /api/mockups/mockup-gen-status
9. Pillar Assign Status: GET /api/mockups/pillar-assign-status
"""

import pytest
import requests
import os
import io
from datetime import datetime

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://mira-parity-sprint.preview.emergentagent.com')

# Test data
TEST_ORDER_ID = None


class TestCustomOrderAPI:
    """Custom Order API endpoint tests"""
    
    def test_create_custom_order(self):
        """POST /api/custom-orders - Create a custom order + service desk ticket"""
        global TEST_ORDER_ID
        
        payload = {
            "product_id": "bp-labrador-mug",
            "product_name": "Labrador Mug",
            "product_type": "mug",
            "product_image": "https://example.com/mug.jpg",
            "pillar": "celebrate",
            "pet_id": "test-pet-123",
            "pet_name": "TestDog",
            "pet_breed": "labrador",
            "pet_birthday": "2020-01-15",
            "pet_archetype": "wild_explorer",
            "customer_email": "test@example.com",
            "customer_name": "Test User",
            "customer_phone": "9876543210",
            "photo_urls": ["https://example.com/photo1.jpg"],
            "personalisation_notes": "Please add a heart shape",
            "special_text": "TestDog - Best Boy",
            "delivery_address": "123 Test Street, Bangalore",
            "source": "soul_picks_modal"
        }
        
        response = requests.post(f"{BASE_URL}/api/custom-orders", json=payload)
        
        # Status code assertion
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Data assertions
        data = response.json()
        assert data.get("success") == True, "Expected success=True"
        assert "order_id" in data, "Expected order_id in response"
        assert "ticket_id" in data, "Expected ticket_id in response"
        assert data.get("status") == "pending_review", "Expected status=pending_review"
        assert "message" in data, "Expected message in response"
        
        # Store order_id for subsequent tests
        TEST_ORDER_ID = data["order_id"]
        print(f"✓ Created custom order: {TEST_ORDER_ID}, ticket: {data['ticket_id']}")
    
    def test_list_custom_orders(self):
        """GET /api/custom-orders - List custom orders"""
        response = requests.get(f"{BASE_URL}/api/custom-orders")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "orders" in data, "Expected 'orders' key in response"
        assert "total" in data, "Expected 'total' key in response"
        assert isinstance(data["orders"], list), "Expected orders to be a list"
        
        print(f"✓ Listed {len(data['orders'])} orders (total: {data['total']})")
    
    def test_list_custom_orders_with_email_filter(self):
        """GET /api/custom-orders?email=test@example.com - Filter by email"""
        response = requests.get(f"{BASE_URL}/api/custom-orders?email=test@example.com")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "orders" in data, "Expected 'orders' key"
        
        # Verify all returned orders have the correct email
        for order in data["orders"]:
            assert order.get("customer", {}).get("email") == "test@example.com", \
                f"Expected email filter to work, got {order.get('customer', {}).get('email')}"
        
        print(f"✓ Filtered orders by email: {len(data['orders'])} found")
    
    def test_get_single_custom_order(self):
        """GET /api/custom-orders/{order_id} - Get single order"""
        global TEST_ORDER_ID
        
        if not TEST_ORDER_ID:
            pytest.skip("No order_id from previous test")
        
        response = requests.get(f"{BASE_URL}/api/custom-orders/{TEST_ORDER_ID}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data.get("order_id") == TEST_ORDER_ID, f"Expected order_id={TEST_ORDER_ID}"
        assert "product" in data, "Expected 'product' in response"
        assert "pet" in data, "Expected 'pet' in response"
        assert "customer" in data, "Expected 'customer' in response"
        assert data.get("status") == "pending_review", "Expected status=pending_review"
        
        print(f"✓ Retrieved order {TEST_ORDER_ID}: {data['product'].get('name')}")
    
    def test_get_nonexistent_order(self):
        """GET /api/custom-orders/NONEXISTENT - Should return 404"""
        response = requests.get(f"{BASE_URL}/api/custom-orders/NONEXISTENT-ORDER-123")
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Correctly returned 404 for nonexistent order")
    
    def test_update_order_status(self):
        """PATCH /api/custom-orders/{order_id}/status - Update order status"""
        global TEST_ORDER_ID
        
        if not TEST_ORDER_ID:
            pytest.skip("No order_id from previous test")
        
        payload = {
            "status": "in_production",
            "admin_notes": "Started production",
            "price_estimate": "₹1,299",
            "delivery_estimate": "5-7 business days"
        }
        
        response = requests.patch(
            f"{BASE_URL}/api/custom-orders/{TEST_ORDER_ID}/status",
            json=payload
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data.get("success") == True, "Expected success=True"
        assert data.get("status") == "in_production", "Expected status=in_production"
        
        # Verify the update persisted
        verify_response = requests.get(f"{BASE_URL}/api/custom-orders/{TEST_ORDER_ID}")
        verify_data = verify_response.json()
        assert verify_data.get("status") == "in_production", "Status update not persisted"
        assert verify_data.get("admin_notes") == "Started production", "Admin notes not persisted"
        
        print(f"✓ Updated order status to 'in_production'")
    
    def test_update_status_missing_status(self):
        """PATCH /api/custom-orders/{order_id}/status - Missing status should fail"""
        global TEST_ORDER_ID
        
        if not TEST_ORDER_ID:
            pytest.skip("No order_id from previous test")
        
        response = requests.patch(
            f"{BASE_URL}/api/custom-orders/{TEST_ORDER_ID}/status",
            json={"admin_notes": "Just notes, no status"}
        )
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print("✓ Correctly rejected status update without status field")


class TestPhotoUploadAPI:
    """Photo Upload API tests"""
    
    def test_upload_photo_no_file(self):
        """POST /api/custom-orders/upload-photo - No file should fail"""
        response = requests.post(f"{BASE_URL}/api/custom-orders/upload-photo")
        
        # Should fail with 422 (validation error) since file is required
        assert response.status_code == 422, f"Expected 422, got {response.status_code}"
        print("✓ Correctly rejected upload without file")
    
    def test_upload_photo_invalid_type(self):
        """POST /api/custom-orders/upload-photo - Non-image should fail"""
        # Create a fake text file
        files = {
            'file': ('test.txt', io.BytesIO(b'This is not an image'), 'text/plain')
        }
        data = {
            'pet_id': 'test-pet',
            'pet_name': 'TestDog'
        }
        
        response = requests.post(
            f"{BASE_URL}/api/custom-orders/upload-photo",
            files=files,
            data=data
        )
        
        # Should fail with 400 (only images accepted)
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print("✓ Correctly rejected non-image file")


class TestBreedProductsAPI:
    """Breed Products API tests"""
    
    def test_breed_products_by_breed_and_pillar(self):
        """GET /api/mockups/breed-products?breed=labrador&pillar=celebrate"""
        response = requests.get(
            f"{BASE_URL}/api/mockups/breed-products",
            params={"breed": "labrador", "pillar": "celebrate", "limit": 20}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "products" in data, "Expected 'products' key"
        assert "count" in data, "Expected 'count' key"
        assert "filters" in data, "Expected 'filters' key"
        
        # Verify filters are applied
        assert data["filters"].get("breed") == "labrador", "Breed filter not applied"
        assert data["filters"].get("pillar") == "celebrate", "Pillar filter not applied"
        
        # Check products have expected fields
        if data["products"]:
            product = data["products"][0]
            assert "id" in product or "name" in product, "Product missing id/name"
            print(f"✓ Found {data['count']} labrador celebrate products")
        else:
            print("✓ Query returned 0 products (may be expected)")
    
    def test_breed_products_indie_celebrate(self):
        """GET /api/mockups/breed-products?breed=indie&pillar=celebrate"""
        response = requests.get(
            f"{BASE_URL}/api/mockups/breed-products",
            params={"breed": "indie", "pillar": "celebrate", "limit": 20}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        print(f"✓ Found {data.get('count', 0)} indie celebrate products")
    
    def test_breed_products_with_mockup_filter(self):
        """GET /api/mockups/breed-products?has_mockup=true"""
        response = requests.get(
            f"{BASE_URL}/api/mockups/breed-products",
            params={"has_mockup": "true", "limit": 10}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        # Verify products have mockup_url
        for product in data.get("products", []):
            assert product.get("mockup_url"), f"Product {product.get('id')} missing mockup_url"
        
        print(f"✓ Found {data.get('count', 0)} products with mockups")


class TestAdminBreedProductsAPI:
    """Admin Breed Products API tests"""
    
    def test_admin_breed_products_pillar_filter(self):
        """GET /api/admin/breed-products?pillar=celebrate&breed=indie"""
        response = requests.get(
            f"{BASE_URL}/api/admin/breed-products",
            params={"pillar": "celebrate", "breed": "indie", "limit": 20}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "products" in data, "Expected 'products' key"
        assert "total" in data, "Expected 'total' key"
        
        print(f"✓ Admin API: Found {data.get('total', 0)} indie celebrate products")
    
    def test_admin_breed_products_all(self):
        """GET /api/admin/breed-products - List all"""
        response = requests.get(
            f"{BASE_URL}/api/admin/breed-products",
            params={"limit": 10}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "products" in data, "Expected 'products' key"
        print(f"✓ Admin API: Total breed products: {data.get('total', 0)}")


class TestMockupStatusAPI:
    """Mockup Generation Status API tests"""
    
    def test_mockup_gen_status(self):
        """GET /api/mockups/mockup-gen-status - Get mockup generation status"""
        response = requests.get(f"{BASE_URL}/api/mockups/mockup-gen-status")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        # Should have status fields
        assert "running" in data, "Expected 'running' field"
        assert "total" in data, "Expected 'total' field"
        assert "generated" in data, "Expected 'generated' field"
        assert "failed" in data, "Expected 'failed' field"
        
        print(f"✓ Mockup gen status: running={data['running']}, generated={data['generated']}, failed={data['failed']}")
    
    def test_pillar_assign_status(self):
        """GET /api/mockups/pillar-assign-status - Get pillar assignment status"""
        response = requests.get(f"{BASE_URL}/api/mockups/pillar-assign-status")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        # Should have status fields
        assert "running" in data, "Expected 'running' field"
        assert "total" in data, "Expected 'total' field"
        assert "assigned" in data, "Expected 'assigned' field"
        
        print(f"✓ Pillar assign status: running={data['running']}, assigned={data['assigned']}")
    
    def test_mockup_stats(self):
        """GET /api/mockups/stats - Get overall mockup statistics"""
        response = requests.get(f"{BASE_URL}/api/mockups/stats")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "total_products" in data, "Expected 'total_products'"
        assert "products_with_mockups" in data, "Expected 'products_with_mockups'"
        assert "completion_percentage" in data, "Expected 'completion_percentage'"
        
        print(f"✓ Mockup stats: {data['products_with_mockups']}/{data['total_products']} ({data['completion_percentage']}%)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
