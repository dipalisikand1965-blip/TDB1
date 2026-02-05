"""
Finance Manager API Tests
Tests for the Finance & Reconciliation module in admin panel
"""
import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Admin credentials
ADMIN_USERNAME = "aditya"
ADMIN_PASSWORD = "lola4304"


def get_auth():
    """Get Basic Auth for admin requests"""
    import base64
    credentials = base64.b64encode(f"{ADMIN_USERNAME}:{ADMIN_PASSWORD}".encode()).decode()
    return {"Authorization": f"Basic {credentials}"}


class TestFinancePaymentsAPI:
    """Tests for /api/admin/finance/payments endpoint"""
    
    def test_get_payments_returns_200(self):
        """GET /api/admin/finance/payments should return 200 with payments list"""
        response = requests.get(
            f"{BASE_URL}/api/admin/finance/payments",
            headers=get_auth()
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "payments" in data, "Response should contain 'payments' key"
        assert "stats" in data, "Response should contain 'stats' key"
        assert isinstance(data["payments"], list), "Payments should be a list"
    
    def test_get_payments_stats_structure(self):
        """Stats should contain all required fields"""
        response = requests.get(
            f"{BASE_URL}/api/admin/finance/payments",
            headers=get_auth()
        )
        assert response.status_code == 200
        
        stats = response.json().get("stats", {})
        required_fields = [
            "total_collected",
            "pending_amount", 
            "refunds_issued",
            "paw_points_redeemed",
            "discounts_given",
            "today_revenue",
            "pending_reconciliation"
        ]
        
        for field in required_fields:
            assert field in stats, f"Stats should contain '{field}'"
    
    def test_get_payments_unauthorized(self):
        """Should return 401 without auth"""
        response = requests.get(f"{BASE_URL}/api/admin/finance/payments")
        assert response.status_code == 401, f"Expected 401 without auth, got {response.status_code}"


class TestOfflinePaymentAPI:
    """Tests for /api/admin/finance/payments/offline endpoint"""
    
    def test_record_offline_payment_success(self):
        """POST /api/admin/finance/payments/offline should record payment"""
        payment_data = {
            "member_email": "test_finance@example.com",
            "type": "service",
            "reference_id": f"TEST-REF-{datetime.now().strftime('%Y%m%d%H%M%S')}",
            "amount": 500.00,
            "payment_method": "cash",
            "notes": "Test payment from pytest",
            "discount_code": "",
            "discount_amount": 0,
            "paw_points_used": 0
        }
        
        response = requests.post(
            f"{BASE_URL}/api/admin/finance/payments/offline",
            headers={**get_auth(), "Content-Type": "application/json"},
            json=payment_data
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, "Response should indicate success"
        assert "payment_id" in data, "Response should contain payment_id"
        assert data["payment_id"].startswith("PAY-"), "Payment ID should start with PAY-"
    
    def test_record_payment_with_discount(self):
        """Should handle payment with discount"""
        payment_data = {
            "member_email": "test_discount@example.com",
            "type": "membership",
            "amount": 1000.00,
            "payment_method": "razorpay",
            "discount_code": "TEST20",
            "discount_amount": 200.00,
            "paw_points_used": 0
        }
        
        response = requests.post(
            f"{BASE_URL}/api/admin/finance/payments/offline",
            headers={**get_auth(), "Content-Type": "application/json"},
            json=payment_data
        )
        
        assert response.status_code == 200
        assert response.json().get("success") == True
    
    def test_record_payment_missing_email(self):
        """Should handle missing member_email gracefully"""
        payment_data = {
            "type": "service",
            "amount": 500.00,
            "payment_method": "cash"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/admin/finance/payments/offline",
            headers={**get_auth(), "Content-Type": "application/json"},
            json=payment_data
        )
        
        # Should return validation error
        assert response.status_code in [400, 422], f"Expected 400/422, got {response.status_code}"


class TestReconcilePaymentAPI:
    """Tests for /api/admin/finance/payments/{id}/reconcile endpoint"""
    
    @pytest.fixture
    def create_test_payment(self):
        """Create a test payment for reconciliation tests"""
        payment_data = {
            "member_email": "test_reconcile@example.com",
            "type": "service",
            "amount": 750.00,
            "payment_method": "upi",
            "notes": "Test payment for reconciliation"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/admin/finance/payments/offline",
            headers={**get_auth(), "Content-Type": "application/json"},
            json=payment_data
        )
        
        if response.status_code == 200:
            return response.json().get("payment_id")
        return None
    
    def test_reconcile_payment_success(self, create_test_payment):
        """POST /api/admin/finance/payments/{id}/reconcile should mark payment as reconciled"""
        payment_id = create_test_payment
        if not payment_id:
            pytest.skip("Could not create test payment")
        
        reconcile_data = {
            "notes": "Reconciled via pytest"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/admin/finance/payments/{payment_id}/reconcile",
            headers={**get_auth(), "Content-Type": "application/json"},
            json=reconcile_data
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        assert response.json().get("success") == True
    
    def test_reconcile_nonexistent_payment(self):
        """Should return 404 for non-existent payment"""
        response = requests.post(
            f"{BASE_URL}/api/admin/finance/payments/PAY-NONEXISTENT-000000/reconcile",
            headers={**get_auth(), "Content-Type": "application/json"},
            json={"notes": "test"}
        )
        
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"


class TestPaymentDetailsAPI:
    """Tests for /api/admin/finance/payments/{id} endpoint"""
    
    def test_get_payment_details(self):
        """GET /api/admin/finance/payments/{id} should return payment details"""
        # First get a payment ID from the list
        list_response = requests.get(
            f"{BASE_URL}/api/admin/finance/payments",
            headers=get_auth()
        )
        
        if list_response.status_code == 200:
            payments = list_response.json().get("payments", [])
            if payments:
                payment_id = payments[0].get("id")
                
                response = requests.get(
                    f"{BASE_URL}/api/admin/finance/payments/{payment_id}",
                    headers=get_auth()
                )
                
                assert response.status_code == 200
                data = response.json()
                assert "payment" in data, "Response should contain 'payment'"
            else:
                pytest.skip("No payments available to test")
        else:
            pytest.skip("Could not fetch payments list")
    
    def test_get_nonexistent_payment_details(self):
        """Should return 404 for non-existent payment"""
        response = requests.get(
            f"{BASE_URL}/api/admin/finance/payments/PAY-INVALID-999999",
            headers=get_auth()
        )
        
        assert response.status_code == 404


class TestRefundAPI:
    """Tests for /api/admin/finance/payments/{id}/refund endpoint"""
    
    @pytest.fixture
    def create_completed_payment(self):
        """Create a completed payment for refund tests"""
        payment_data = {
            "member_email": "test_refund@example.com",
            "type": "product",
            "amount": 1500.00,
            "payment_method": "card",
            "notes": "Test payment for refund"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/admin/finance/payments/offline",
            headers={**get_auth(), "Content-Type": "application/json"},
            json=payment_data
        )
        
        if response.status_code == 200:
            return response.json().get("payment_id")
        return None
    
    def test_process_refund_success(self, create_completed_payment):
        """POST /api/admin/finance/payments/{id}/refund should process refund"""
        payment_id = create_completed_payment
        if not payment_id:
            pytest.skip("Could not create test payment")
        
        refund_data = {
            "amount": 500.00,
            "reason": "Customer requested partial refund - pytest"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/admin/finance/payments/{payment_id}/refund",
            headers={**get_auth(), "Content-Type": "application/json"},
            json=refund_data
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") == True
        assert "refund_id" in data
    
    def test_refund_exceeds_amount(self, create_completed_payment):
        """Should reject refund amount exceeding original"""
        payment_id = create_completed_payment
        if not payment_id:
            pytest.skip("Could not create test payment")
        
        refund_data = {
            "amount": 99999.00,  # Much more than original
            "reason": "Invalid refund test"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/admin/finance/payments/{payment_id}/refund",
            headers={**get_auth(), "Content-Type": "application/json"},
            json=refund_data
        )
        
        assert response.status_code == 400, f"Expected 400, got {response.status_code}"


class TestPaymentFilters:
    """Tests for payment filtering functionality"""
    
    def test_filter_by_status(self):
        """Should filter payments by status"""
        response = requests.get(
            f"{BASE_URL}/api/admin/finance/payments?status=completed",
            headers=get_auth()
        )
        
        assert response.status_code == 200
        payments = response.json().get("payments", [])
        
        # All returned payments should be completed (if any)
        for payment in payments:
            assert payment.get("status") == "completed", f"Payment {payment.get('id')} has status {payment.get('status')}"
    
    def test_filter_by_type(self):
        """Should filter payments by type"""
        response = requests.get(
            f"{BASE_URL}/api/admin/finance/payments?type=service",
            headers=get_auth()
        )
        
        assert response.status_code == 200
        payments = response.json().get("payments", [])
        
        # All returned payments should be service type
        for payment in payments:
            assert payment.get("type") == "service", f"Payment {payment.get('id')} has type {payment.get('type')}"


# Run tests
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
