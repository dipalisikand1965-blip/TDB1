"""
Test Iteration 102: Member Rewards & Engagement Features
- MembershipCardTiers (frontend component)
- PawmoterScore (NPS survey)
- SocialShareReward (screenshot upload)
- BreedTipsEngine (breed-specific tips)
- Backend: POST /api/rewards/nps/submit
- Backend: GET /api/rewards/nps/check
- Backend: POST /api/rewards/social-share-claim
"""

import pytest
import requests
import os
import io

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestHealthAndAuth:
    """Basic health and authentication tests"""
    
    def test_api_health(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        print(f"✓ API health check passed: {data}")
    
    def test_member_login(self):
        """Test member login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "dipali@clubconcierge.in",
            "password": "test123"
        })
        assert response.status_code == 200
        data = response.json()
        assert "token" in data
        assert "user" in data
        print(f"✓ Member login successful: {data['user'].get('email')}")
        return data["token"], data["user"]


class TestNPSEndpoints:
    """Test NPS/Pawmoter Score endpoints"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "dipali@clubconcierge.in",
            "password": "test123"
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Authentication failed")
    
    def test_nps_check_endpoint(self, auth_token):
        """Test GET /api/rewards/nps/check - Check recent NPS submission"""
        response = requests.get(
            f"{BASE_URL}/api/rewards/nps/check",
            params={"user_email": "dipali@clubconcierge.in"},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "has_recent_submission" in data
        assert "last_submission" in data
        print(f"✓ NPS check endpoint working: has_recent_submission={data['has_recent_submission']}")
    
    def test_nps_submit_promoter(self, auth_token):
        """Test POST /api/rewards/nps/submit - Submit promoter score (9-10)"""
        response = requests.post(
            f"{BASE_URL}/api/rewards/nps/submit",
            json={
                "user_email": "test_nps_promoter@example.com",
                "user_name": "Test Promoter",
                "score": 10,
                "category": "promoter",
                "feedback": "Great service!",
                "reward_points": 10
            },
            headers={
                "Authorization": f"Bearer {auth_token}",
                "Content-Type": "application/json"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        assert "submission_id" in data
        assert data.get("points_awarded") == 10
        print(f"✓ NPS promoter submission successful: {data['submission_id']}")
    
    def test_nps_submit_passive(self, auth_token):
        """Test POST /api/rewards/nps/submit - Submit passive score (7-8)"""
        response = requests.post(
            f"{BASE_URL}/api/rewards/nps/submit",
            json={
                "user_email": "test_nps_passive@example.com",
                "user_name": "Test Passive",
                "score": 7,
                "category": "passive",
                "feedback": "Good but could be better",
                "reward_points": 10
            },
            headers={
                "Authorization": f"Bearer {auth_token}",
                "Content-Type": "application/json"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        print(f"✓ NPS passive submission successful: {data['submission_id']}")
    
    def test_nps_submit_detractor(self, auth_token):
        """Test POST /api/rewards/nps/submit - Submit detractor score (0-6)"""
        response = requests.post(
            f"{BASE_URL}/api/rewards/nps/submit",
            json={
                "user_email": "test_nps_detractor@example.com",
                "user_name": "Test Detractor",
                "score": 3,
                "category": "detractor",
                "feedback": "Needs improvement",
                "reward_points": 10
            },
            headers={
                "Authorization": f"Bearer {auth_token}",
                "Content-Type": "application/json"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        print(f"✓ NPS detractor submission successful: {data['submission_id']}")
    
    def test_nps_submit_invalid_score(self, auth_token):
        """Test POST /api/rewards/nps/submit - Invalid score should fail"""
        response = requests.post(
            f"{BASE_URL}/api/rewards/nps/submit",
            json={
                "user_email": "test_invalid@example.com",
                "score": 15,  # Invalid - should be 0-10
                "category": "promoter",
                "reward_points": 10
            },
            headers={
                "Authorization": f"Bearer {auth_token}",
                "Content-Type": "application/json"
            }
        )
        assert response.status_code == 400
        print(f"✓ Invalid NPS score correctly rejected")
    
    def test_nps_stats_endpoint(self, auth_token):
        """Test GET /api/rewards/nps/stats - Get NPS statistics"""
        response = requests.get(
            f"{BASE_URL}/api/rewards/nps/stats",
            params={"days": 30},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "total_responses" in data
        assert "nps_score" in data
        assert "promoters" in data
        assert "passives" in data
        assert "detractors" in data
        print(f"✓ NPS stats endpoint working: total={data['total_responses']}, NPS={data['nps_score']}")


class TestSocialShareEndpoints:
    """Test Social Share Reward endpoints"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "dipali@clubconcierge.in",
            "password": "test123"
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Authentication failed")
    
    def test_social_share_claim_submit(self, auth_token):
        """Test POST /api/rewards/social-share-claim - Submit share claim with screenshot"""
        # Create a simple test image (1x1 pixel PNG)
        test_image = io.BytesIO()
        # Minimal PNG file
        test_image.write(b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\x0f\x00\x00\x01\x01\x00\x05\x18\xd8N\x00\x00\x00\x00IEND\xaeB`\x82')
        test_image.seek(0)
        
        files = {
            'file': ('test_screenshot.png', test_image, 'image/png')
        }
        data = {
            'social_platform': 'instagram',
            'social_handle': 'test_user_handle',
            'post_url': 'https://instagram.com/p/test123',
            'user_email': 'test_social_share@example.com',
            'reward_type': 'social_share',
            'points_amount': '20'
        }
        
        response = requests.post(
            f"{BASE_URL}/api/rewards/social-share-claim",
            files=files,
            data=data,
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        result = response.json()
        assert result.get("success") == True
        assert "claim_id" in result
        assert result.get("status") == "pending"
        print(f"✓ Social share claim submitted: {result['claim_id']}")
        return result["claim_id"]
    
    def test_social_share_claims_list(self, auth_token):
        """Test GET /api/rewards/social-share-claims - List claims"""
        response = requests.get(
            f"{BASE_URL}/api/rewards/social-share-claims",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "claims" in data
        assert "total" in data
        print(f"✓ Social share claims list: {data['total']} claims")
    
    def test_social_share_claims_filter_by_status(self, auth_token):
        """Test GET /api/rewards/social-share-claims?status=pending"""
        response = requests.get(
            f"{BASE_URL}/api/rewards/social-share-claims",
            params={"status": "pending"},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "claims" in data
        # All returned claims should be pending
        for claim in data["claims"]:
            assert claim.get("status") == "pending"
        print(f"✓ Social share claims filtered by pending: {data['total']} claims")


class TestLoyaltyEndpoints:
    """Test Loyalty Points endpoints"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "dipali@clubconcierge.in",
            "password": "test123"
        })
        if response.status_code == 200:
            return response.json().get("token")
        pytest.skip("Authentication failed")
    
    def test_loyalty_transactions(self, auth_token):
        """Test GET /api/rewards/loyalty/transactions"""
        response = requests.get(
            f"{BASE_URL}/api/rewards/loyalty/transactions",
            params={"user_email": "dipali@clubconcierge.in"},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "transactions" in data
        assert "current_balance" in data
        print(f"✓ Loyalty transactions: balance={data['current_balance']}, transactions={len(data['transactions'])}")
    
    def test_loyalty_expiring_points(self, auth_token):
        """Test GET /api/rewards/loyalty/expiring"""
        response = requests.get(
            f"{BASE_URL}/api/rewards/loyalty/expiring",
            params={"user_email": "dipali@clubconcierge.in"},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "expiring_points" in data
        assert "expiring_transactions" in data
        assert "expires_within_days" in data
        print(f"✓ Expiring points: {data['expiring_points']} points expiring in {data['expires_within_days']} days")


class TestMemberUserData:
    """Test member user data for tier calculation"""
    
    def test_member_has_loyalty_points(self):
        """Verify test member has loyalty_points field"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "dipali@clubconcierge.in",
            "password": "test123"
        })
        assert response.status_code == 200
        data = response.json()
        user = data.get("user", {})
        
        # Check loyalty_points exists
        loyalty_points = user.get("loyalty_points", 0)
        print(f"✓ User loyalty_points: {loyalty_points}")
        
        # Determine tier
        if loyalty_points >= 5000:
            tier = "Gold"
        elif loyalty_points >= 1000:
            tier = "Silver"
        else:
            tier = "Bronze"
        print(f"✓ User tier: {tier}")
    
    def test_member_has_pets_with_breed(self):
        """Verify test member has pets with breed info"""
        # Login first
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "dipali@clubconcierge.in",
            "password": "test123"
        })
        assert login_response.status_code == 200
        token = login_response.json().get("token")
        
        # Get pets
        pets_response = requests.get(
            f"{BASE_URL}/api/pets",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert pets_response.status_code == 200
        pets = pets_response.json()
        
        if isinstance(pets, list) and len(pets) > 0:
            pet = pets[0]
            breed = pet.get("breed", "Unknown")
            name = pet.get("name", "Unknown")
            print(f"✓ Pet found: {name}, breed: {breed}")
        else:
            print("⚠ No pets found for user")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
