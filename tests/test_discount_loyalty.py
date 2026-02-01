"""
Test suite for Discount Codes and Loyalty Points features
Tests: POST /api/discount-codes/validate, GET /api/loyalty/balance
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://doggy-dashboard-7.preview.emergentagent.com').rstrip('/')

class TestDiscountCodes:
    """Discount code validation tests"""
    
    def test_validate_comeback10_valid_order(self):
        """Test COMEBACK10 code with valid order total (>= ₹500)"""
        response = requests.post(
            f"{BASE_URL}/api/discount-codes/validate",
            params={"code": "COMEBACK10", "order_total": 1000}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Validate response structure
        assert data["valid"] == True
        assert data["code"] == "COMEBACK10"
        assert data["type"] == "percentage"
        assert data["value"] == 10.0
        assert data["discount_amount"] == 100.0  # 10% of 1000
        assert data["final_total"] == 900.0
        assert "description" in data
        print(f"✓ COMEBACK10 validated: {data['discount_amount']} discount on ₹1000 order")
    
    def test_validate_comeback10_minimum_order(self):
        """Test COMEBACK10 code fails with order below minimum (₹500)"""
        response = requests.post(
            f"{BASE_URL}/api/discount-codes/validate",
            params={"code": "COMEBACK10", "order_total": 400}
        )
        assert response.status_code == 400
        data = response.json()
        assert "Minimum order" in data["detail"]
        print(f"✓ COMEBACK10 correctly rejected for order below minimum: {data['detail']}")
    
    def test_validate_welcome15_valid_order(self):
        """Test WELCOME15 code with valid order total (>= ₹799)"""
        response = requests.post(
            f"{BASE_URL}/api/discount-codes/validate",
            params={"code": "WELCOME15", "order_total": 1000}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["valid"] == True
        assert data["code"] == "WELCOME15"
        assert data["type"] == "percentage"
        assert data["value"] == 15.0
        assert data["discount_amount"] == 150.0  # 15% of 1000
        print(f"✓ WELCOME15 validated: {data['discount_amount']} discount")
    
    def test_validate_welcome15_max_discount_cap(self):
        """Test WELCOME15 code respects max discount cap (₹200)"""
        response = requests.post(
            f"{BASE_URL}/api/discount-codes/validate",
            params={"code": "WELCOME15", "order_total": 2000}
        )
        assert response.status_code == 200
        data = response.json()
        
        # 15% of 2000 = 300, but max is 200
        assert data["discount_amount"] == 200.0
        print(f"✓ WELCOME15 max discount cap applied: {data['discount_amount']} (capped at ₹200)")
    
    def test_validate_birthday20_valid_order(self):
        """Test BIRTHDAY20 code with valid order total (>= ₹999)"""
        response = requests.post(
            f"{BASE_URL}/api/discount-codes/validate",
            params={"code": "BIRTHDAY20", "order_total": 1500}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["valid"] == True
        assert data["code"] == "BIRTHDAY20"
        assert data["type"] == "percentage"
        assert data["value"] == 20.0
        # 20% of 1500 = 300, max is 300
        assert data["discount_amount"] == 300.0
        print(f"✓ BIRTHDAY20 validated: {data['discount_amount']} discount")
    
    def test_validate_invalid_code(self):
        """Test invalid discount code returns 404"""
        response = requests.post(
            f"{BASE_URL}/api/discount-codes/validate",
            params={"code": "INVALID_CODE", "order_total": 1000}
        )
        assert response.status_code == 404
        data = response.json()
        assert "Invalid discount code" in data["detail"]
        print(f"✓ Invalid code correctly rejected: {data['detail']}")
    
    def test_validate_case_insensitive(self):
        """Test discount code validation is case insensitive"""
        response = requests.post(
            f"{BASE_URL}/api/discount-codes/validate",
            params={"code": "comeback10", "order_total": 1000}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["code"] == "COMEBACK10"  # Should be normalized to uppercase
        print(f"✓ Code validation is case insensitive")


class TestLoyaltyPoints:
    """Loyalty points balance and redemption tests"""
    
    def test_get_loyalty_balance_existing_user(self):
        """Test getting loyalty balance for test@example.com (has 500 points)"""
        response = requests.get(
            f"{BASE_URL}/api/loyalty/balance",
            params={"user_id": "test@example.com"}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Validate response structure
        assert "points" in data
        assert "total_earned" in data
        assert "total_redeemed" in data
        assert "tier" in data
        assert "multiplier" in data
        assert "redemption_value" in data
        
        # Validate values
        assert data["points"] == 500
        assert data["redemption_value"] == 0.5  # 1 point = ₹0.50
        print(f"✓ Loyalty balance for test@example.com: {data['points']} points (worth ₹{data['points'] * data['redemption_value']})")
    
    def test_get_loyalty_balance_nonexistent_user(self):
        """Test getting loyalty balance for non-existent user returns 0"""
        response = requests.get(
            f"{BASE_URL}/api/loyalty/balance",
            params={"user_id": "nonexistent@example.com"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["points"] == 0
        assert data["tier"] == "free"
        print(f"✓ Non-existent user returns 0 points")
    
    def test_loyalty_redemption_value(self):
        """Test loyalty points redemption value is correct (1 point = ₹0.50)"""
        response = requests.get(
            f"{BASE_URL}/api/loyalty/balance",
            params={"user_id": "test@example.com"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert data["redemption_value"] == 0.5
        # 500 points * 0.5 = ₹250 worth
        expected_value = data["points"] * data["redemption_value"]
        assert expected_value == 250.0
        print(f"✓ Redemption value correct: {data['points']} points = ₹{expected_value}")


class TestAdminDiscountCodes:
    """Admin discount codes management tests"""
    
    def test_get_all_discount_codes(self):
        """Test admin can get all discount codes"""
        response = requests.get(
            f"{BASE_URL}/api/admin/discount-codes",
            auth=("aditya", "lola4304")
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "codes" in data
        assert "total" in data
        assert "active" in data
        assert data["total"] >= 3  # At least 3 codes exist
        
        # Verify expected codes exist
        codes = [c["code"] for c in data["codes"]]
        assert "COMEBACK10" in codes
        assert "WELCOME15" in codes
        assert "BIRTHDAY20" in codes
        print(f"✓ Admin retrieved {data['total']} discount codes ({data['active']} active)")


class TestIntegration:
    """Integration tests for discount + loyalty combined"""
    
    def test_discount_and_loyalty_calculation(self):
        """Test that discount and loyalty can be calculated together"""
        # Get discount
        discount_response = requests.post(
            f"{BASE_URL}/api/discount-codes/validate",
            params={"code": "COMEBACK10", "order_total": 1000}
        )
        assert discount_response.status_code == 200
        discount_data = discount_response.json()
        
        # Get loyalty balance
        loyalty_response = requests.get(
            f"{BASE_URL}/api/loyalty/balance",
            params={"user_id": "test@example.com"}
        )
        assert loyalty_response.status_code == 200
        loyalty_data = loyalty_response.json()
        
        # Calculate combined savings
        discount_amount = discount_data["discount_amount"]
        loyalty_value = loyalty_data["points"] * loyalty_data["redemption_value"]
        
        subtotal = 1000
        total_after_discount = subtotal - discount_amount
        total_after_loyalty = total_after_discount - loyalty_value
        
        print(f"✓ Combined calculation:")
        print(f"  Subtotal: ₹{subtotal}")
        print(f"  Discount (COMEBACK10): -₹{discount_amount}")
        print(f"  Loyalty ({loyalty_data['points']} pts): -₹{loyalty_value}")
        print(f"  Final: ₹{max(0, total_after_loyalty)}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
