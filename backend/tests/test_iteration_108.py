"""
Iteration 108 Tests - Pet Life Operating System
Testing:
1. Report Builder API (Sales, Ticket reports with pillar-wise and consolidated data)
2. GST Calculation (should calculate on subtotal + shipping, not just subtotal)
3. Mobile Navbar Sign In/Sign Out visibility (tested via frontend)
4. Onboarding form (Soul Whisper toggle, Push notification info, PWA install prompt)
"""

import pytest
import requests
import os
import base64

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Admin credentials
ADMIN_USERNAME = "aditya"
ADMIN_PASSWORD = "lola4304"
ADMIN_AUTH = base64.b64encode(f"{ADMIN_USERNAME}:{ADMIN_PASSWORD}".encode()).decode()


class TestReportBuilderAPI:
    """Test Report Builder endpoints at /api/admin/reports/*"""
    
    def test_daily_summary_report(self):
        """Test daily_summary report generation"""
        response = requests.get(
            f"{BASE_URL}/api/admin/reports/generate",
            params={"report_type": "daily_summary", "period": "last_30_days"},
            headers={"Authorization": f"Basic {ADMIN_AUTH}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data["report_type"] == "daily_summary"
        assert "summary" in data
        assert "columns" in data
        assert "date_range" in data
        
        # Verify summary contains expected metrics
        summary_labels = [item["label"] for item in data["summary"]]
        assert "Total Revenue" in summary_labels
        assert "Orders" in summary_labels
        assert "New Members" in summary_labels
        print(f"✅ Daily summary report: {len(data['summary'])} metrics returned")
    
    def test_ticket_report(self):
        """Test ticket_report generation"""
        response = requests.get(
            f"{BASE_URL}/api/admin/reports/generate",
            params={"report_type": "ticket_report", "period": "last_30_days"},
            headers={"Authorization": f"Basic {ADMIN_AUTH}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data["report_type"] == "ticket_report"
        assert "summary" in data
        assert "columns" in data
        assert "rows" in data
        
        # Verify ticket-specific metrics
        summary_labels = [item["label"] for item in data["summary"]]
        assert "Total Tickets" in summary_labels
        assert "Open" in summary_labels
        assert "Resolved" in summary_labels
        
        # Verify analytics breakdown
        if "analytics" in data:
            assert "by_status" in data["analytics"]
            assert "by_pillar" in data["analytics"]
        
        print(f"✅ Ticket report: {data['summary'][0]['value']} total tickets")
    
    def test_pillar_performance_report(self):
        """Test pillar_performance report (pillar-wise breakdown)"""
        response = requests.get(
            f"{BASE_URL}/api/admin/reports/generate",
            params={"report_type": "pillar_performance", "period": "last_30_days"},
            headers={"Authorization": f"Basic {ADMIN_AUTH}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data["report_type"] == "pillar_performance"
        assert "summary" in data
        assert "columns" in data
        assert "rows" in data
        
        # Verify columns include pillar breakdown
        assert "Pillar" in data["columns"]
        assert "Orders" in data["columns"]
        assert "Revenue" in data["columns"]
        
        print(f"✅ Pillar performance report: {len(data['rows'])} pillars with data")
    
    def test_order_report(self):
        """Test order_report generation"""
        response = requests.get(
            f"{BASE_URL}/api/admin/reports/generate",
            params={"report_type": "order_report", "period": "last_30_days"},
            headers={"Authorization": f"Basic {ADMIN_AUTH}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data["report_type"] == "order_report"
        assert "summary" in data
        assert "columns" in data
        
        # Verify order columns
        expected_columns = ["Order ID", "Date", "Customer", "Pillar", "Amount", "Status"]
        for col in expected_columns:
            assert col in data["columns"], f"Missing column: {col}"
        
        print(f"✅ Order report: {data['summary'][0]['value']} total orders")
    
    def test_csv_export(self):
        """Test CSV export functionality"""
        response = requests.get(
            f"{BASE_URL}/api/admin/reports/export/csv",
            params={"report_type": "daily_summary", "period": "last_30_days"},
            headers={"Authorization": f"Basic {ADMIN_AUTH}"}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        assert "text/csv" in response.headers.get("content-type", "")
        
        # Verify CSV has content
        csv_content = response.text
        assert len(csv_content) > 0
        assert "," in csv_content  # CSV should have commas
        
        print(f"✅ CSV export working, {len(csv_content)} bytes")
    
    def test_report_requires_auth(self):
        """Test that report endpoints require authentication"""
        response = requests.get(
            f"{BASE_URL}/api/admin/reports/generate",
            params={"report_type": "daily_summary"}
        )
        
        # Should return 401 without auth
        assert response.status_code == 401, f"Expected 401 without auth, got {response.status_code}"
        print("✅ Report endpoints properly require authentication")


class TestGSTCalculation:
    """Test GST calculation includes shipping in taxable amount"""
    
    def test_gst_on_subtotal_plus_shipping(self):
        """GST should be calculated on (subtotal - discount + shipping)"""
        payload = {
            "customer": {"name": "Test User", "email": "test@test.com", "phone": "9876543210"},
            "delivery": {"method": "delivery", "state": "Karnataka"},
            "items": [{"id": "test1", "name": "Test Product", "price": 500, "quantity": 2}],
            "subtotal": 1000,
            "shipping_fee": 150,
            "discount_amount": 0,
            "loyalty_points_used": 0,
            "loyalty_discount": 0
        }
        
        response = requests.post(
            f"{BASE_URL}/api/checkout/calculate-total",
            json=payload
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        
        # Verify taxable amount includes shipping
        # taxable_amount = subtotal - discount + shipping = 1000 - 0 + 150 = 1150
        assert data["taxable_amount"] == 1150, f"Expected taxable_amount=1150, got {data['taxable_amount']}"
        
        # Verify GST is calculated on 1150 (18% = 207)
        gst_details = data["gst_details"]
        assert gst_details["taxable_amount"] == 1150
        assert gst_details["total_tax"] == 207  # 18% of 1150
        
        # Verify grand total = taxable_amount + GST = 1150 + 207 = 1357
        assert data["grand_total"] == 1357, f"Expected grand_total=1357, got {data['grand_total']}"
        
        print(f"✅ GST correctly calculated on subtotal + shipping: ₹{data['grand_total']}")
    
    def test_gst_with_discount(self):
        """GST should be calculated on (subtotal - discount + shipping)"""
        payload = {
            "customer": {"name": "Test User", "email": "test@test.com", "phone": "9876543210"},
            "delivery": {"method": "delivery", "state": "Karnataka"},
            "items": [{"id": "test1", "name": "Test Product", "price": 500, "quantity": 2}],
            "subtotal": 1000,
            "shipping_fee": 150,
            "discount_amount": 100,
            "loyalty_points_used": 0,
            "loyalty_discount": 0
        }
        
        response = requests.post(
            f"{BASE_URL}/api/checkout/calculate-total",
            json=payload
        )
        
        assert response.status_code == 200
        
        data = response.json()
        
        # taxable_amount = 1000 - 100 + 150 = 1050
        assert data["taxable_amount"] == 1050, f"Expected taxable_amount=1050, got {data['taxable_amount']}"
        
        # GST = 18% of 1050 = 189
        assert data["gst_details"]["total_tax"] == 189
        
        # grand_total = 1050 + 189 = 1239
        assert data["grand_total"] == 1239
        
        print(f"✅ GST with discount correctly calculated: ₹{data['grand_total']}")
    
    def test_gst_same_state_cgst_sgst(self):
        """Same state (Karnataka) should use CGST + SGST"""
        payload = {
            "customer": {"name": "Test User", "email": "test@test.com", "phone": "9876543210"},
            "delivery": {"method": "delivery", "state": "Karnataka"},
            "items": [{"id": "test1", "name": "Test Product", "price": 1000, "quantity": 1}],
            "subtotal": 1000,
            "shipping_fee": 0,
            "discount_amount": 0,
            "loyalty_points_used": 0,
            "loyalty_discount": 0
        }
        
        response = requests.post(
            f"{BASE_URL}/api/checkout/calculate-total",
            json=payload
        )
        
        assert response.status_code == 200
        
        data = response.json()
        gst_details = data["gst_details"]
        
        # Same state should use CGST + SGST
        assert gst_details["is_same_state"] == True
        assert gst_details["gst_type"] == "CGST+SGST"
        assert gst_details["cgst_rate"] == 9.0
        assert gst_details["sgst_rate"] == 9.0
        assert gst_details["cgst_amount"] == 90  # 9% of 1000
        assert gst_details["sgst_amount"] == 90  # 9% of 1000
        
        print("✅ Same state GST correctly uses CGST + SGST")
    
    def test_gst_different_state_igst(self):
        """Different state should use IGST"""
        payload = {
            "customer": {"name": "Test User", "email": "test@test.com", "phone": "9876543210"},
            "delivery": {"method": "delivery", "state": "Maharashtra"},
            "items": [{"id": "test1", "name": "Test Product", "price": 1000, "quantity": 1}],
            "subtotal": 1000,
            "shipping_fee": 0,
            "discount_amount": 0,
            "loyalty_points_used": 0,
            "loyalty_discount": 0
        }
        
        response = requests.post(
            f"{BASE_URL}/api/checkout/calculate-total",
            json=payload
        )
        
        assert response.status_code == 200
        
        data = response.json()
        gst_details = data["gst_details"]
        
        # Different state should use IGST
        assert gst_details["is_same_state"] == False
        assert gst_details["gst_type"] == "IGST"
        assert gst_details["igst_rate"] == 18.0
        assert gst_details["igst_amount"] == 180  # 18% of 1000
        
        print("✅ Different state GST correctly uses IGST")


class TestCheckoutConfig:
    """Test checkout configuration endpoint"""
    
    def test_checkout_config(self):
        """Test /api/checkout/config returns expected configuration"""
        response = requests.get(f"{BASE_URL}/api/checkout/config")
        
        assert response.status_code == 200
        
        data = response.json()
        
        # Verify expected config fields
        assert "gst_rate" in data
        assert data["gst_rate"] == 18  # 18% GST
        assert "free_shipping_threshold" in data
        assert "default_shipping_fee" in data
        assert "payment_methods" in data
        
        print(f"✅ Checkout config: GST rate {data['gst_rate']}%, free shipping above ₹{data['free_shipping_threshold']}")


class TestMemberAnalytics:
    """Test member analytics report"""
    
    def test_member_analytics_report(self):
        """Test member_analytics report generation"""
        response = requests.get(
            f"{BASE_URL}/api/admin/reports/generate",
            params={"report_type": "member_analytics", "period": "last_30_days"},
            headers={"Authorization": f"Basic {ADMIN_AUTH}"}
        )
        
        assert response.status_code == 200
        
        data = response.json()
        assert data["report_type"] == "member_analytics"
        
        summary_labels = [item["label"] for item in data["summary"]]
        assert "Total Members" in summary_labels
        assert "New This Period" in summary_labels
        
        print(f"✅ Member analytics: {data['summary'][0]['value']} total members")


class TestPetAnalytics:
    """Test pet analytics report"""
    
    def test_pet_analytics_report(self):
        """Test pet_analytics report generation"""
        response = requests.get(
            f"{BASE_URL}/api/admin/reports/generate",
            params={"report_type": "pet_analytics", "period": "last_30_days"},
            headers={"Authorization": f"Basic {ADMIN_AUTH}"}
        )
        
        assert response.status_code == 200
        
        data = response.json()
        assert data["report_type"] == "pet_analytics"
        
        summary_labels = [item["label"] for item in data["summary"]]
        assert "Total Pets" in summary_labels
        assert "With Soul Score" in summary_labels
        
        print(f"✅ Pet analytics: {data['summary'][0]['value']} total pets")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
