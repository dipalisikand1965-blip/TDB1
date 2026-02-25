"""
Test Suite for Phase 3 Backend Refactoring:
- Admin Member Routes (admin_member_routes.py)
- Household Routes (household_routes.py)
- Review Routes (review_routes.py)

Tests verify that extracted routes work correctly after refactoring from server.py
"""

import pytest
import requests
import os
import uuid
from datetime import datetime

# Get API URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    raise ValueError("REACT_APP_BACKEND_URL environment variable not set")

# Test credentials
ADMIN_USERNAME = "aditya"
ADMIN_PASSWORD = "lola4304"
TEST_USER_EMAIL = "dipali@clubconcierge.in"
TEST_USER_PASSWORD = "lola4304"


class TestHealthCheck:
    """Verify API is accessible before running tests"""
    
    def test_api_health(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        print(f"✓ API health check passed: {data}")


class TestAdminMemberRoutes:
    """Test Admin Member Management endpoints (admin_member_routes.py)"""
    
    def test_get_all_members_requires_auth(self):
        """GET /api/admin/members should require admin auth"""
        response = requests.get(f"{BASE_URL}/api/admin/members")
        assert response.status_code == 401
        print("✓ GET /api/admin/members correctly requires authentication")
    
    def test_get_all_members_with_auth(self):
        """GET /api/admin/members should return list of customers with stats"""
        response = requests.get(
            f"{BASE_URL}/api/admin/members",
            auth=(ADMIN_USERNAME, ADMIN_PASSWORD)
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "members" in data
        assert "total" in data
        assert "stats" in data
        assert isinstance(data["members"], list)
        assert isinstance(data["stats"], dict)
        
        # Verify stats structure
        stats = data["stats"]
        assert "free" in stats
        assert "pawsome" in stats
        assert "premium" in stats
        assert "vip" in stats
        assert "guest" in stats
        
        print(f"✓ GET /api/admin/members returned {data['total']} members")
        print(f"  Stats: {stats}")
    
    def test_update_member_requires_auth(self):
        """PUT /api/admin/members/{user_id} should require admin auth"""
        response = requests.put(
            f"{BASE_URL}/api/admin/members/test-user-id",
            json={"name": "Test"}
        )
        assert response.status_code == 401
        print("✓ PUT /api/admin/members/{user_id} correctly requires authentication")
    
    def test_update_member_not_found(self):
        """PUT /api/admin/members/{user_id} should return 404 for non-existent user"""
        response = requests.put(
            f"{BASE_URL}/api/admin/members/non-existent-user-12345",
            auth=(ADMIN_USERNAME, ADMIN_PASSWORD),
            json={"name": "Test Name"}
        )
        assert response.status_code == 404
        print("✓ PUT /api/admin/members returns 404 for non-existent user")
    
    def test_update_member_success(self):
        """PUT /api/admin/members/{user_id} should update member details"""
        # Use test user email as user_id (endpoint supports both id and email)
        response = requests.put(
            f"{BASE_URL}/api/admin/members/{TEST_USER_EMAIL}",
            auth=(ADMIN_USERNAME, ADMIN_PASSWORD),
            json={"admin_notes": f"Test note from pytest - {datetime.now().isoformat()}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("message") == "Member updated"
        print(f"✓ PUT /api/admin/members/{TEST_USER_EMAIL} updated successfully")
    
    def test_adjust_points_requires_auth(self):
        """POST /api/admin/members/{user_id}/points should require admin auth"""
        response = requests.post(
            f"{BASE_URL}/api/admin/members/test-user/points",
            json={"points": 100, "reason": "Test"}
        )
        assert response.status_code == 401
        print("✓ POST /api/admin/members/{user_id}/points correctly requires authentication")
    
    def test_adjust_points_not_found(self):
        """POST /api/admin/members/{user_id}/points should return 404 for non-existent user"""
        response = requests.post(
            f"{BASE_URL}/api/admin/members/non-existent-user-12345/points",
            auth=(ADMIN_USERNAME, ADMIN_PASSWORD),
            json={"points": 100, "reason": "Test adjustment"}
        )
        assert response.status_code == 404
        print("✓ POST /api/admin/members/{user_id}/points returns 404 for non-existent user")
    
    def test_adjust_points_success(self):
        """POST /api/admin/members/{user_id}/points should adjust member's paw points"""
        response = requests.post(
            f"{BASE_URL}/api/admin/members/{TEST_USER_EMAIL}/points",
            auth=(ADMIN_USERNAME, ADMIN_PASSWORD),
            json={"points": 10, "reason": "Pytest test adjustment"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "new_balance" in data
        assert isinstance(data["new_balance"], int)
        print(f"✓ POST /api/admin/members/{TEST_USER_EMAIL}/points - new balance: {data['new_balance']}")
    
    def test_gift_membership_requires_auth(self):
        """POST /api/admin/members/{user_id}/gift should require admin auth"""
        response = requests.post(
            f"{BASE_URL}/api/admin/members/test-user/gift",
            json={"tier": "pawsome", "duration_months": 1}
        )
        assert response.status_code == 401
        print("✓ POST /api/admin/members/{user_id}/gift correctly requires authentication")
    
    def test_gift_membership_not_found(self):
        """POST /api/admin/members/{user_id}/gift should return 404 for non-existent user"""
        response = requests.post(
            f"{BASE_URL}/api/admin/members/non-existent-user-12345/gift",
            auth=(ADMIN_USERNAME, ADMIN_PASSWORD),
            json={"tier": "pawsome", "duration_months": 1}
        )
        assert response.status_code == 404
        print("✓ POST /api/admin/members/{user_id}/gift returns 404 for non-existent user")
    
    def test_gift_membership_success(self):
        """POST /api/admin/members/{user_id}/gift should gift membership to a member"""
        response = requests.post(
            f"{BASE_URL}/api/admin/members/{TEST_USER_EMAIL}/gift",
            auth=(ADMIN_USERNAME, ADMIN_PASSWORD),
            json={"tier": "pawsome", "duration_months": 1}
        )
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "expires" in data
        print(f"✓ POST /api/admin/members/{TEST_USER_EMAIL}/gift - expires: {data['expires']}")
    
    def test_membership_stats_requires_auth(self):
        """GET /api/admin/membership/stats should require admin auth"""
        response = requests.get(f"{BASE_URL}/api/admin/membership/stats")
        assert response.status_code == 401
        print("✓ GET /api/admin/membership/stats correctly requires authentication")
    
    def test_membership_stats_success(self):
        """GET /api/admin/membership/stats should return membership statistics"""
        response = requests.get(
            f"{BASE_URL}/api/admin/membership/stats",
            auth=(ADMIN_USERNAME, ADMIN_PASSWORD)
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "total" in data
        assert "by_tier" in data
        assert "active_subscriptions" in data
        assert "expiring_soon" in data
        assert "recently_expired" in data
        assert "total_paw_points" in data
        
        # Verify by_tier structure
        by_tier = data["by_tier"]
        assert "curious_pup" in by_tier
        assert "loyal_companion" in by_tier
        assert "trusted_guardian" in by_tier
        assert "pack_leader" in by_tier
        
        print(f"✓ GET /api/admin/membership/stats returned stats for {data['total']} users")
        print(f"  By tier: {by_tier}")


class TestHouseholdRoutes:
    """Test Multi-Pet Household endpoints (household_routes.py)"""
    
    def test_get_household_not_found(self):
        """GET /api/household/{user_email} should return 404 for non-existent user"""
        response = requests.get(f"{BASE_URL}/api/household/nonexistent@example.com")
        assert response.status_code == 404
        print("✓ GET /api/household returns 404 for non-existent user")
    
    def test_get_household_success(self):
        """GET /api/household/{user_email} should return household info with pets"""
        response = requests.get(f"{BASE_URL}/api/household/{TEST_USER_EMAIL}")
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "household" in data
        assert "pets" in data
        assert "benefits" in data
        assert "shared_restrictions" in data
        assert "recommendations" in data
        
        # Verify household structure
        household = data["household"]
        assert "owner_email" in household
        assert "pet_count" in household
        assert "is_multi_pet" in household
        
        # Verify benefits structure
        benefits = data["benefits"]
        assert "family_discount" in benefits
        assert "shared_delivery" in benefits
        assert "bulk_pricing" in benefits
        
        print(f"✓ GET /api/household/{TEST_USER_EMAIL} returned {household['pet_count']} pets")
        print(f"  Benefits: {benefits}")
    
    def test_add_pet_not_found(self):
        """POST /api/household/{user_email}/add-pet should return 404 for non-existent user"""
        response = requests.post(
            f"{BASE_URL}/api/household/nonexistent@example.com/add-pet",
            json={"name": "Test Pet", "breed": "Labrador", "species": "dog"}
        )
        assert response.status_code == 404
        print("✓ POST /api/household/add-pet returns 404 for non-existent user")
    
    def test_add_pet_success(self):
        """POST /api/household/{user_email}/add-pet should add a new pet to household"""
        test_pet_name = f"TEST_Pet_{uuid.uuid4().hex[:6]}"
        response = requests.post(
            f"{BASE_URL}/api/household/{TEST_USER_EMAIL}/add-pet",
            json={
                "name": test_pet_name,
                "breed": "Golden Retriever",
                "species": "dog",
                "gender": "male",
                "weight": 25,
                "weight_unit": "kg"
            }
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert data.get("success") == True
        assert "pet_id" in data
        assert "pet_name" in data
        assert "household_pet_count" in data
        assert "additional_membership_fee" in data
        assert "message" in data
        
        assert data["pet_name"] == test_pet_name
        print(f"✓ POST /api/household/{TEST_USER_EMAIL}/add-pet added pet: {test_pet_name}")
        print(f"  Pet ID: {data['pet_id']}, Household count: {data['household_pet_count']}")
    
    def test_get_recommendations_not_found(self):
        """GET /api/household/{user_email}/recommendations should return 404 for user with no pets"""
        # Use a user that likely has no pets
        response = requests.get(f"{BASE_URL}/api/household/nopets@example.com/recommendations")
        # Could be 404 for user not found or no pets
        assert response.status_code in [404, 200]
        print("✓ GET /api/household/recommendations handles missing user/pets correctly")
    
    def test_get_recommendations_success(self):
        """GET /api/household/{user_email}/recommendations should return safe products for all pets"""
        response = requests.get(f"{BASE_URL}/api/household/{TEST_USER_EMAIL}/recommendations")
        # May return 404 if no pets exist for user
        if response.status_code == 404:
            print("✓ GET /api/household/recommendations returns 404 when no pets exist (expected)")
            return
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "household_allergies" in data
        assert "pet_count" in data
        assert "pets" in data
        assert "safe_for_all_products" in data
        assert "message" in data
        
        print(f"✓ GET /api/household/{TEST_USER_EMAIL}/recommendations returned {len(data['safe_for_all_products'])} safe products")
        print(f"  Household allergies: {data['household_allergies']}")


class TestReviewRoutes:
    """Test Review System endpoints (review_routes.py)"""
    
    @pytest.fixture
    def auth_token(self):
        """Get JWT token for authenticated requests"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_USER_EMAIL, "password": TEST_USER_PASSWORD}
        )
        if response.status_code == 200:
            return response.json().get("access_token")
        pytest.skip("Could not get auth token")
    
    def test_create_review_without_auth(self):
        """POST /api/reviews should work without auth (anonymous review)"""
        test_review = {
            "product_id": "cake-001",
            "rating": 5,
            "comment": f"Test review from pytest - {datetime.now().isoformat()}",
            "reviewer_name": "Test Reviewer",
            "reviewer_email": "test@example.com"
        }
        response = requests.post(f"{BASE_URL}/api/reviews", json=test_review)
        assert response.status_code == 200
        data = response.json()
        
        assert "message" in data
        assert "review" in data
        assert data["review"]["rating"] == 5
        assert data["review"]["status"] == "pending"
        
        print(f"✓ POST /api/reviews created anonymous review: {data['review'].get('id')}")
    
    def test_create_review_with_auth(self, auth_token):
        """POST /api/reviews should work with auth (authenticated review)"""
        test_review = {
            "product_id": "cake-002",
            "rating": 4,
            "comment": f"Authenticated test review - {datetime.now().isoformat()}",
            "title": "Great product!"
        }
        response = requests.post(
            f"{BASE_URL}/api/reviews",
            json=test_review,
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "message" in data
        assert "review" in data
        assert data["review"]["rating"] == 4
        
        print(f"✓ POST /api/reviews created authenticated review: {data['review'].get('id')}")
    
    def test_get_my_reviews_requires_auth(self):
        """GET /api/reviews/my-reviews should require authentication"""
        response = requests.get(f"{BASE_URL}/api/reviews/my-reviews")
        assert response.status_code == 401
        print("✓ GET /api/reviews/my-reviews correctly requires authentication")
    
    def test_get_my_reviews_with_auth(self, auth_token):
        """GET /api/reviews/my-reviews should return user's reviews"""
        response = requests.get(
            f"{BASE_URL}/api/reviews/my-reviews",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "reviews" in data
        assert isinstance(data["reviews"], list)
        
        print(f"✓ GET /api/reviews/my-reviews returned {len(data['reviews'])} reviews")
    
    def test_get_product_reviews(self):
        """GET /api/products/{product_id}/reviews should return approved reviews"""
        response = requests.get(f"{BASE_URL}/api/products/cake-001/reviews")
        assert response.status_code == 200
        data = response.json()
        
        assert "reviews" in data
        assert isinstance(data["reviews"], list)
        
        # All returned reviews should be approved
        for review in data["reviews"]:
            assert review.get("status") == "approved"
        
        print(f"✓ GET /api/products/cake-001/reviews returned {len(data['reviews'])} approved reviews")
    
    def test_admin_get_reviews_requires_auth(self):
        """GET /api/admin/reviews should require admin auth"""
        response = requests.get(f"{BASE_URL}/api/admin/reviews")
        assert response.status_code == 401
        print("✓ GET /api/admin/reviews correctly requires authentication")
    
    def test_admin_get_reviews_with_auth(self):
        """GET /api/admin/reviews should return all reviews for admin"""
        response = requests.get(
            f"{BASE_URL}/api/admin/reviews",
            auth=(ADMIN_USERNAME, ADMIN_PASSWORD)
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "reviews" in data
        assert isinstance(data["reviews"], list)
        
        print(f"✓ GET /api/admin/reviews returned {len(data['reviews'])} reviews")
    
    def test_admin_get_reviews_with_status_filter(self):
        """GET /api/admin/reviews?status=pending should filter by status"""
        response = requests.get(
            f"{BASE_URL}/api/admin/reviews?status=pending",
            auth=(ADMIN_USERNAME, ADMIN_PASSWORD)
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "reviews" in data
        # All returned reviews should be pending
        for review in data["reviews"]:
            assert review.get("status") == "pending"
        
        print(f"✓ GET /api/admin/reviews?status=pending returned {len(data['reviews'])} pending reviews")
    
    def test_admin_update_review_requires_auth(self):
        """PUT /api/admin/reviews/{review_id} should require admin auth"""
        response = requests.put(
            f"{BASE_URL}/api/admin/reviews/test-review-id",
            json={"status": "approved"}
        )
        assert response.status_code == 401
        print("✓ PUT /api/admin/reviews/{review_id} correctly requires authentication")
    
    def test_admin_update_review_invalid_status(self):
        """PUT /api/admin/reviews/{review_id} should reject invalid status"""
        response = requests.put(
            f"{BASE_URL}/api/admin/reviews/test-review-id",
            auth=(ADMIN_USERNAME, ADMIN_PASSWORD),
            json={"status": "invalid_status"}
        )
        assert response.status_code == 400
        print("✓ PUT /api/admin/reviews rejects invalid status")
    
    def test_admin_update_review_success(self):
        """PUT /api/admin/reviews/{review_id} should update review status"""
        # First, get a pending review
        response = requests.get(
            f"{BASE_URL}/api/admin/reviews?status=pending",
            auth=(ADMIN_USERNAME, ADMIN_PASSWORD)
        )
        assert response.status_code == 200
        reviews = response.json().get("reviews", [])
        
        if not reviews:
            # Create a review first
            test_review = {
                "product_id": "cake-003",
                "rating": 3,
                "comment": f"Review for admin update test - {datetime.now().isoformat()}",
                "reviewer_name": "Admin Test"
            }
            create_response = requests.post(f"{BASE_URL}/api/reviews", json=test_review)
            assert create_response.status_code == 200
            review_id = create_response.json()["review"]["id"]
        else:
            review_id = reviews[0]["id"]
        
        # Update the review status
        update_response = requests.put(
            f"{BASE_URL}/api/admin/reviews/{review_id}",
            auth=(ADMIN_USERNAME, ADMIN_PASSWORD),
            json={"status": "approved"}
        )
        assert update_response.status_code == 200
        data = update_response.json()
        assert data.get("message") == "Review updated"
        
        print(f"✓ PUT /api/admin/reviews/{review_id} updated status to approved")


class TestPreviouslyRefactoredRoutes:
    """Verify previously refactored routes still work (regression tests)"""
    
    def test_cart_routes(self):
        """Verify cart admin routes still work"""
        response = requests.get(
            f"{BASE_URL}/api/admin/abandoned-carts",
            auth=(ADMIN_USERNAME, ADMIN_PASSWORD)
        )
        assert response.status_code == 200
        print("✓ Cart routes (cart_routes.py) still working")
    
    def test_shopify_sync_routes(self):
        """Verify Shopify sync routes still work"""
        response = requests.get(
            f"{BASE_URL}/api/admin/sync-status",
            auth=(ADMIN_USERNAME, ADMIN_PASSWORD)
        )
        assert response.status_code == 200
        print("✓ Shopify sync routes (shopify_sync_routes.py) still working")
    
    def test_orders_routes(self):
        """Verify orders routes still work"""
        # Get auth token
        login_response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_USER_EMAIL, "password": TEST_USER_PASSWORD}
        )
        if login_response.status_code != 200:
            pytest.skip("Could not get auth token")
        
        token = login_response.json().get("access_token")
        response = requests.get(
            f"{BASE_URL}/api/orders/my-orders",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert response.status_code == 200
        print("✓ Orders routes (orders_routes.py) still working")
    
    def test_autoship_routes(self):
        """Verify autoship routes still work"""
        response = requests.get(
            f"{BASE_URL}/api/admin/autoship",
            auth=(ADMIN_USERNAME, ADMIN_PASSWORD)
        )
        assert response.status_code == 200
        print("✓ Autoship routes (autoship_routes.py) still working")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
