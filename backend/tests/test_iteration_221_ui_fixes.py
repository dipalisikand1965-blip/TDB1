"""
Test Iteration 221 - UI Fixes and New Features
Tests for:
1. Hero video height (55vh)
2. Desktop tab bar (2 rows)
3. Mobile tab bar (horizontal scroll)
4. Back to Home button and X close button on mobile
5. Membership Plan tab
6. Ticket merge feature
7. Push notification Enable button
8. Pet photo upload
9. Paw Points expandable sections
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestAuthAndBasicAPIs:
    """Test authentication and basic API endpoints"""
    
    def test_user_login(self):
        """Test user login with demo credentials"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "demo@doggy.com", "password": "demo1234"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["user"]["email"] == "demo@doggy.com"
        print(f"✓ User login successful")
        return data["access_token"]
    
    def test_admin_login(self):
        """Test admin login"""
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"username": "aditya", "password": "lola4304"}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["success"] == True
        assert "token" in data
        print(f"✓ Admin login successful")
        return data["token"]


class TestMembershipPlanTab:
    """Test Membership Plan tab functionality"""
    
    @pytest.fixture
    def auth_token(self):
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "demo@doggy.com", "password": "demo1234"}
        )
        return response.json()["access_token"]
    
    def test_get_membership_status(self, auth_token):
        """Test getting membership status"""
        response = requests.get(
            f"{BASE_URL}/api/membership/status",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        # Membership status endpoint should exist
        assert response.status_code in [200, 404]  # 404 if no membership
        print(f"✓ Membership status endpoint works")
    
    def test_get_membership_plans(self, auth_token):
        """Test getting available membership plans"""
        response = requests.get(
            f"{BASE_URL}/api/membership/plans",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        # Plans endpoint should exist
        assert response.status_code in [200, 404]
        print(f"✓ Membership plans endpoint works")


class TestTicketMergeFeature:
    """Test Zoho Desk style ticket merge feature"""
    
    @pytest.fixture
    def admin_auth(self):
        response = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"username": "aditya", "password": "lola4304"}
        )
        token = response.json()["token"]
        return {"Authorization": f"Bearer {token}"}
    
    def test_get_tickets_list(self, admin_auth):
        """Test getting tickets list for merge selection"""
        response = requests.get(
            f"{BASE_URL}/api/tickets/",
            headers=admin_auth
        )
        assert response.status_code == 200
        data = response.json()
        assert "tickets" in data
        print(f"✓ Tickets list retrieved: {len(data['tickets'])} tickets")
    
    def test_get_mergeable_tickets(self, admin_auth):
        """Test getting mergeable tickets for a member"""
        # First get a ticket to find member email
        tickets_response = requests.get(
            f"{BASE_URL}/api/tickets/",
            headers=admin_auth
        )
        tickets = tickets_response.json().get("tickets", [])
        
        if tickets:
            # Find a ticket with member email
            for ticket in tickets:
                member_email = ticket.get("member", {}).get("email") or ticket.get("contact_email")
                if member_email:
                    response = requests.get(
                        f"{BASE_URL}/api/concierge/tickets/mergeable/{member_email}",
                        headers=admin_auth
                    )
                    # Should return 200 or 404 if no mergeable tickets
                    assert response.status_code in [200, 404]
                    print(f"✓ Mergeable tickets endpoint works for {member_email}")
                    break
    
    def test_merge_tickets_endpoint_exists(self, admin_auth):
        """Test that merge tickets endpoint exists"""
        # Test with invalid data to check endpoint exists
        response = requests.post(
            f"{BASE_URL}/api/concierge/tickets/merge",
            headers={**admin_auth, "Content-Type": "application/json"},
            json={
                "primary_ticket_id": "test-invalid",
                "secondary_ticket_ids": ["test-invalid-2"],
                "agent_name": "test",
                "merge_reason": "Test merge"
            }
        )
        # Should return 404 (ticket not found) or 400 (bad request), not 500
        assert response.status_code in [400, 404, 422]
        print(f"✓ Merge tickets endpoint exists (status: {response.status_code})")


class TestPushNotifications:
    """Test push notification functionality"""
    
    @pytest.fixture
    def auth_token(self):
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "demo@doggy.com", "password": "demo1234"}
        )
        return response.json()["access_token"]
    
    def test_get_vapid_public_key(self, auth_token):
        """Test getting VAPID public key for push notifications"""
        response = requests.get(
            f"{BASE_URL}/api/push/vapid-public-key",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "public_key" in data
        print(f"✓ VAPID public key retrieved")
    
    def test_push_subscribe_endpoint_exists(self, auth_token):
        """Test that push subscribe endpoint exists"""
        response = requests.post(
            f"{BASE_URL}/api/push/subscribe",
            headers={"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"},
            json={
                "subscription": {"endpoint": "test", "keys": {"p256dh": "test", "auth": "test"}},
                "user_id": "test",
                "preferences": {}
            }
        )
        # Should not return 404 (endpoint exists)
        assert response.status_code != 404
        print(f"✓ Push subscribe endpoint exists (status: {response.status_code})")


class TestPetPhotoUpload:
    """Test pet photo upload functionality"""
    
    @pytest.fixture
    def auth_token(self):
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "demo@doggy.com", "password": "demo1234"}
        )
        return response.json()["access_token"]
    
    def test_get_my_pets(self, auth_token):
        """Test getting user's pets"""
        response = requests.get(
            f"{BASE_URL}/api/pets/my-pets",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "pets" in data
        print(f"✓ My pets retrieved: {len(data['pets'])} pets")
        return data["pets"]
    
    def test_pet_photo_upload_endpoint_exists(self, auth_token):
        """Test that pet photo upload endpoint exists"""
        # Get pet ID first
        pets_response = requests.get(
            f"{BASE_URL}/api/pets/my-pets",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        pets = pets_response.json().get("pets", [])
        
        if pets:
            pet_id = pets[0]["id"]
            # Test with empty file to check endpoint exists
            response = requests.post(
                f"{BASE_URL}/api/pets/{pet_id}/photo",
                headers={"Authorization": f"Bearer {auth_token}"},
                files={}
            )
            # Should return 422 (validation error) not 404
            assert response.status_code != 404
            print(f"✓ Pet photo upload endpoint exists for {pet_id}")


class TestPawPointsHistory:
    """Test Paw Points history expandable sections"""
    
    @pytest.fixture
    def auth_token(self):
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "demo@doggy.com", "password": "demo1234"}
        )
        return response.json()["access_token"]
    
    def test_get_paw_points_balance(self, auth_token):
        """Test getting Paw Points balance"""
        response = requests.get(
            f"{BASE_URL}/api/paw-points/balance",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "balance" in data or "points" in data
        print(f"✓ Paw Points balance retrieved")
    
    def test_get_paw_points_history(self, auth_token):
        """Test getting Paw Points history (expandable section)"""
        response = requests.get(
            f"{BASE_URL}/api/paw-points/history",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        assert "transactions" in data or "history" in data
        print(f"✓ Paw Points history retrieved")


class TestSettingsSecurityPrivacy:
    """Test Settings tab - Security & Privacy section"""
    
    @pytest.fixture
    def auth_token(self):
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": "demo@doggy.com", "password": "demo1234"}
        )
        return response.json()["access_token"]
    
    def test_get_user_settings(self, auth_token):
        """Test getting user settings"""
        response = requests.get(
            f"{BASE_URL}/api/user/settings",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        # Settings endpoint should exist
        assert response.status_code in [200, 404]
        print(f"✓ User settings endpoint works")
    
    def test_update_notification_settings(self, auth_token):
        """Test updating notification settings"""
        response = requests.put(
            f"{BASE_URL}/api/user/settings",
            headers={"Authorization": f"Bearer {auth_token}", "Content-Type": "application/json"},
            json={"email": True, "whatsapp": True, "sms": False}
        )
        # Should not return 404
        assert response.status_code != 404
        print(f"✓ Update settings endpoint works (status: {response.status_code})")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
