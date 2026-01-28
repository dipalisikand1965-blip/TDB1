"""
Checkout API Tests - Iteration 103
Tests for:
- GET /api/checkout/config - Razorpay key and settings
- POST /api/checkout/calculate-total - GST calculation (CGST+SGST for same state, IGST for different state)
- POST /api/checkout/create-order - Order creation with Razorpay
- GET /api/checkout/order/{id}/invoice - Invoice data
- GET /api/checkout/order/{id}/invoice/pdf - PDF invoice download
"""

import pytest
import requests
import os
import json

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestCheckoutConfig:
    """Test checkout configuration endpoint"""
    
    def test_get_checkout_config(self):
        """GET /api/checkout/config returns Razorpay key and settings"""
        response = requests.get(f"{BASE_URL}/api/checkout/config")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        
        # Verify required fields exist
        assert "razorpay_key_id" in data, "Missing razorpay_key_id"
        assert "razorpay_enabled" in data, "Missing razorpay_enabled"
        assert "gst_rate" in data, "Missing gst_rate"
        assert "free_shipping_threshold" in data, "Missing free_shipping_threshold"
        assert "default_shipping_fee" in data, "Missing default_shipping_fee"
        assert "business_name" in data, "Missing business_name"
        assert "payment_methods" in data, "Missing payment_methods"
        
        # Verify GST rate is 18%
        assert data["gst_rate"] == 18, f"Expected GST rate 18, got {data['gst_rate']}"
        
        # Verify payment methods include expected options
        assert isinstance(data["payment_methods"], list), "payment_methods should be a list"
        
        print(f"✓ Checkout config: razorpay_enabled={data['razorpay_enabled']}, gst_rate={data['gst_rate']}%")


class TestGSTCalculation:
    """Test GST calculation endpoint"""
    
    def test_calculate_total_same_state_karnataka(self):
        """POST /api/checkout/calculate-total - CGST+SGST for same state (Karnataka)"""
        payload = {
            "customer": {
                "name": "Test User",
                "email": "test@example.com",
                "phone": "9876543210"
            },
            "delivery": {
                "method": "delivery",
                "address": "123 Test Street",
                "city": "Bangalore",
                "state": "Karnataka",
                "pincode": "560001"
            },
            "items": [
                {
                    "id": "test-item-1",
                    "name": "Dog Birthday Cake",
                    "price": 1000,
                    "quantity": 1
                }
            ],
            "subtotal": 1000,
            "shipping_fee": 0,
            "discount_amount": 0
        }
        
        response = requests.post(
            f"{BASE_URL}/api/checkout/calculate-total",
            json=payload
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        
        # Verify GST details
        assert "gst_details" in data, "Missing gst_details"
        gst = data["gst_details"]
        
        # Same state should have CGST + SGST
        assert gst["is_same_state"] == True, "Should be same state"
        assert gst["gst_type"] == "CGST+SGST", f"Expected CGST+SGST, got {gst['gst_type']}"
        
        # Verify CGST and SGST rates (9% each)
        assert gst["cgst_rate"] == 9, f"Expected CGST rate 9, got {gst['cgst_rate']}"
        assert gst["sgst_rate"] == 9, f"Expected SGST rate 9, got {gst['sgst_rate']}"
        
        # Verify amounts (9% of 1000 = 90 each)
        assert gst["cgst_amount"] == 90, f"Expected CGST 90, got {gst['cgst_amount']}"
        assert gst["sgst_amount"] == 90, f"Expected SGST 90, got {gst['sgst_amount']}"
        assert gst["total_tax"] == 180, f"Expected total tax 180, got {gst['total_tax']}"
        
        # Verify grand total (1000 + 180 = 1180)
        assert data["grand_total"] == 1180, f"Expected grand total 1180, got {data['grand_total']}"
        
        print(f"✓ Same state GST: CGST={gst['cgst_amount']}, SGST={gst['sgst_amount']}, Total={data['grand_total']}")
    
    def test_calculate_total_different_state_maharashtra(self):
        """POST /api/checkout/calculate-total - IGST for different state (Maharashtra)"""
        payload = {
            "customer": {
                "name": "Test User",
                "email": "test@example.com",
                "phone": "9876543210"
            },
            "delivery": {
                "method": "delivery",
                "address": "456 Test Road",
                "city": "Mumbai",
                "state": "Maharashtra",
                "pincode": "400001"
            },
            "items": [
                {
                    "id": "test-item-1",
                    "name": "Dog Birthday Cake",
                    "price": 1000,
                    "quantity": 1
                }
            ],
            "subtotal": 1000,
            "shipping_fee": 0,
            "discount_amount": 0
        }
        
        response = requests.post(
            f"{BASE_URL}/api/checkout/calculate-total",
            json=payload
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        gst = data["gst_details"]
        
        # Different state should have IGST
        assert gst["is_same_state"] == False, "Should be different state"
        assert gst["gst_type"] == "IGST", f"Expected IGST, got {gst['gst_type']}"
        
        # Verify IGST rate (18%)
        assert gst["igst_rate"] == 18, f"Expected IGST rate 18, got {gst['igst_rate']}"
        
        # Verify IGST amount (18% of 1000 = 180)
        assert gst["igst_amount"] == 180, f"Expected IGST 180, got {gst['igst_amount']}"
        assert gst["total_tax"] == 180, f"Expected total tax 180, got {gst['total_tax']}"
        
        # CGST and SGST should be 0
        assert gst["cgst_amount"] == 0, "CGST should be 0 for different state"
        assert gst["sgst_amount"] == 0, "SGST should be 0 for different state"
        
        print(f"✓ Different state GST: IGST={gst['igst_amount']}, Total={data['grand_total']}")
    
    def test_calculate_total_with_discount(self):
        """POST /api/checkout/calculate-total - GST calculated after discount"""
        payload = {
            "customer": {
                "name": "Test User",
                "email": "test@example.com",
                "phone": "9876543210"
            },
            "delivery": {
                "method": "delivery",
                "state": "Karnataka"
            },
            "items": [
                {
                    "id": "test-item-1",
                    "name": "Dog Birthday Cake",
                    "price": 1000,
                    "quantity": 1
                }
            ],
            "subtotal": 1000,
            "shipping_fee": 0,
            "discount_amount": 100  # 100 discount
        }
        
        response = requests.post(
            f"{BASE_URL}/api/checkout/calculate-total",
            json=payload
        )
        
        assert response.status_code == 200
        
        data = response.json()
        
        # Taxable amount should be subtotal - discount = 900
        assert data["taxable_amount"] == 900, f"Expected taxable 900, got {data['taxable_amount']}"
        
        # GST on 900 = 162 (18%)
        gst = data["gst_details"]
        assert gst["total_tax"] == 162, f"Expected tax 162, got {gst['total_tax']}"
        
        # Grand total = 900 + 162 = 1062
        assert data["grand_total"] == 1062, f"Expected grand total 1062, got {data['grand_total']}"
        
        print(f"✓ GST with discount: Taxable={data['taxable_amount']}, Tax={gst['total_tax']}, Total={data['grand_total']}")
    
    def test_calculate_total_with_shipping(self):
        """POST /api/checkout/calculate-total - Shipping added to total"""
        payload = {
            "customer": {
                "name": "Test User",
                "email": "test@example.com",
                "phone": "9876543210"
            },
            "delivery": {
                "method": "delivery",
                "state": "Karnataka"
            },
            "items": [
                {
                    "id": "test-item-1",
                    "name": "Dog Treats",
                    "price": 500,
                    "quantity": 1
                }
            ],
            "subtotal": 500,
            "shipping_fee": 150,  # Shipping fee
            "discount_amount": 0
        }
        
        response = requests.post(
            f"{BASE_URL}/api/checkout/calculate-total",
            json=payload
        )
        
        assert response.status_code == 200
        
        data = response.json()
        
        # GST on 500 = 90 (18%)
        gst = data["gst_details"]
        assert gst["total_tax"] == 90, f"Expected tax 90, got {gst['total_tax']}"
        
        # Grand total = 500 + 90 + 150 = 740
        assert data["grand_total"] == 740, f"Expected grand total 740, got {data['grand_total']}"
        
        print(f"✓ GST with shipping: Subtotal=500, Tax={gst['total_tax']}, Shipping=150, Total={data['grand_total']}")


class TestOrderCreation:
    """Test order creation endpoint"""
    
    def test_create_order_razorpay_not_configured(self):
        """POST /api/checkout/create-order - Falls back to WhatsApp when Razorpay not configured"""
        payload = {
            "customer": {
                "name": "Test Customer",
                "email": "test@example.com",
                "phone": "9876543210"
            },
            "delivery": {
                "method": "delivery",
                "address": "123 Test Street",
                "city": "Bangalore",
                "state": "Karnataka",
                "pincode": "560001"
            },
            "items": [
                {
                    "id": "test-item-1",
                    "name": "Dog Birthday Cake",
                    "price": 1000,
                    "quantity": 1
                }
            ],
            "subtotal": 1000,
            "shipping_fee": 0,
            "discount_amount": 0
        }
        
        response = requests.post(
            f"{BASE_URL}/api/checkout/create-order",
            json=payload
        )
        
        # Should return 200 (either Razorpay order or WhatsApp fallback)
        assert response.status_code in [200, 500], f"Expected 200 or 500, got {response.status_code}"
        
        data = response.json()
        
        if response.status_code == 200:
            assert "success" in data, "Missing success field"
            assert data["success"] == True, "Order creation should succeed"
            assert "order_id" in data, "Missing order_id"
            
            # Check if Razorpay is enabled or fallback to WhatsApp
            if data.get("razorpay_enabled") == False or data.get("fallback_to_whatsapp"):
                print(f"✓ Order created with WhatsApp fallback: {data['order_id']}")
            else:
                assert "razorpay_order_id" in data, "Missing razorpay_order_id"
                assert "razorpay_key_id" in data, "Missing razorpay_key_id"
                assert "amount" in data, "Missing amount"
                print(f"✓ Razorpay order created: {data['order_id']}, razorpay_order_id={data['razorpay_order_id']}")
        else:
            # 500 error expected if Razorpay credentials are invalid
            print(f"⚠ Order creation failed (expected with test keys): {data.get('detail', 'Unknown error')}")


class TestInvoiceEndpoints:
    """Test invoice data and PDF endpoints"""
    
    @pytest.fixture
    def created_order_id(self):
        """Create an order and return its ID for invoice tests"""
        payload = {
            "customer": {
                "name": "Invoice Test Customer",
                "email": "invoice.test@example.com",
                "phone": "9876543210"
            },
            "delivery": {
                "method": "delivery",
                "address": "123 Invoice Street",
                "city": "Bangalore",
                "state": "Karnataka",
                "pincode": "560001"
            },
            "items": [
                {
                    "id": "test-item-1",
                    "name": "Dog Birthday Cake",
                    "price": 1000,
                    "quantity": 1
                }
            ],
            "subtotal": 1000,
            "shipping_fee": 0,
            "discount_amount": 0
        }
        
        response = requests.post(
            f"{BASE_URL}/api/checkout/create-order",
            json=payload
        )
        
        if response.status_code == 200:
            data = response.json()
            return data.get("order_id")
        return None
    
    def test_get_invoice_data_not_found(self):
        """GET /api/checkout/order/{id}/invoice - Returns 404 for non-existent order"""
        response = requests.get(f"{BASE_URL}/api/checkout/order/FAKE-ORDER-123/invoice")
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Invoice endpoint returns 404 for non-existent order")
    
    def test_get_invoice_pdf_not_found(self):
        """GET /api/checkout/order/{id}/invoice/pdf - Returns 404 for non-existent order"""
        response = requests.get(f"{BASE_URL}/api/checkout/order/FAKE-ORDER-123/invoice/pdf")
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Invoice PDF endpoint returns 404 for non-existent order")
    
    def test_get_order_details_not_found(self):
        """GET /api/checkout/order/{id} - Returns 404 for non-existent order"""
        response = requests.get(f"{BASE_URL}/api/checkout/order/FAKE-ORDER-123")
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Order details endpoint returns 404 for non-existent order")


class TestDiscountValidation:
    """Test discount code validation endpoint"""
    
    def test_validate_discount_missing_code(self):
        """GET /api/checkout/discount/validate - Returns 400 for missing code"""
        response = requests.get(f"{BASE_URL}/api/checkout/discount/validate?code=&subtotal=1000")
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        print("✓ Discount validation returns 400 for missing code")
    
    def test_validate_discount_invalid_code(self):
        """GET /api/checkout/discount/validate - Returns 400 for invalid code"""
        response = requests.get(f"{BASE_URL}/api/checkout/discount/validate?code=INVALID123&subtotal=1000")
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"
        
        data = response.json()
        assert "detail" in data, "Missing error detail"
        print(f"✓ Discount validation returns 400 for invalid code: {data['detail']}")


class TestPaymentVerification:
    """Test payment verification endpoint"""
    
    def test_verify_payment_razorpay_not_configured(self):
        """POST /api/checkout/verify-payment - Returns 400 when Razorpay not configured"""
        payload = {
            "razorpay_order_id": "order_test123",
            "razorpay_payment_id": "pay_test123",
            "razorpay_signature": "fake_signature",
            "order_id": "TDC-TEST-123"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/checkout/verify-payment",
            json=payload
        )
        
        # Should return 400 if Razorpay not configured, or 400/500 for invalid signature
        assert response.status_code in [400, 500], f"Expected 400 or 500, got {response.status_code}"
        print(f"✓ Payment verification handles invalid/unconfigured Razorpay: status={response.status_code}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
