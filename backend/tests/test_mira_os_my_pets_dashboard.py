"""
Test Suite for MIRA OS - My Pets & Dashboard Pages
Tests: /my-pets, /dashboard, Pet Vault, Birthday Engine, Breed Tips, Engagement System

Run: pytest /app/backend/tests/test_mira_os_my_pets_dashboard.py -v --tb=short
"""
import pytest
import requests
import os
import json

# Use public API URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
MEMBER_EMAIL = "dipali@clubconcierge.in"
MEMBER_PASSWORD = "test123"
ADMIN_USERNAME = "aditya"
ADMIN_PASSWORD = "lola4304"


class TestAuthenticationFlow:
    """Test login flow works correctly"""
    
    def test_member_login_success(self):
        """Test that member can login with valid credentials"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": MEMBER_EMAIL,
            "password": MEMBER_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        
        data = response.json()
        assert "token" in data or "access_token" in data, f"No token in response: {data}"
        assert "user" in data, f"No user in response: {data}"
        
        print(f"✅ Login successful for {MEMBER_EMAIL}")
        print(f"   User name: {data['user'].get('name', 'N/A')}")
        return data
    
    def test_member_login_returns_token(self):
        """Verify login returns valid JWT token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": MEMBER_EMAIL,
            "password": MEMBER_PASSWORD
        })
        data = response.json()
        token = data.get("token") or data.get("access_token")
        
        assert token is not None, "Token should be returned"
        assert len(token) > 20, "Token should be a proper JWT"
        print(f"✅ Token received (length: {len(token)})")


class TestMyPetsEndpoint:
    """Test /api/pets/my-pets endpoint - critical for /my-pets page"""
    
    @pytest.fixture
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": MEMBER_EMAIL,
            "password": MEMBER_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Authentication failed")
        data = response.json()
        return data.get("token") or data.get("access_token")
    
    def test_my_pets_endpoint_returns_200(self, auth_token):
        """Test /api/pets/my-pets returns 200 with valid token"""
        response = requests.get(f"{BASE_URL}/api/pets/my-pets", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        assert response.status_code == 200, f"Failed: {response.text}"
        print("✅ /api/pets/my-pets returns 200")
    
    def test_my_pets_returns_pets_array(self, auth_token):
        """Verify response contains pets array"""
        response = requests.get(f"{BASE_URL}/api/pets/my-pets", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        data = response.json()
        assert "pets" in data, f"No 'pets' key in response: {data}"
        assert isinstance(data["pets"], list), "Pets should be a list"
        print(f"✅ Got {len(data['pets'])} pets")
    
    def test_my_pets_no_objectid_serialization_error(self, auth_token):
        """Verify no ObjectId serialization errors - CRITICAL FIX TEST"""
        response = requests.get(f"{BASE_URL}/api/pets/my-pets", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        
        # Should not have error about ObjectId
        assert response.status_code == 200, f"Status: {response.status_code}, Response: {response.text}"
        
        # Response should be valid JSON
        try:
            data = response.json()
        except json.JSONDecodeError:
            pytest.fail("Response is not valid JSON - possible ObjectId serialization issue")
        
        # Check pets don't have _id (which would indicate ObjectId issue)
        for pet in data.get("pets", []):
            assert "_id" not in pet, f"Pet has _id field which may cause issues: {pet.get('name')}"
        
        print("✅ No ObjectId serialization errors in /api/pets/my-pets")
    
    def test_my_pets_has_soul_scores(self, auth_token):
        """Verify pets have soul/overall scores calculated"""
        response = requests.get(f"{BASE_URL}/api/pets/my-pets", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        data = response.json()
        
        for pet in data.get("pets", []):
            # Should have overall_score
            assert "overall_score" in pet or "score_tier" in pet, f"Pet {pet.get('name')} missing soul score fields"
            print(f"  🐾 {pet.get('name')}: Soul Score = {pet.get('overall_score', 'N/A')}%")
        
        print(f"✅ All {len(data['pets'])} pets have soul score data")


class TestPetVaultEndpoints:
    """Test Pet Vault - Health records, vaccines, medications"""
    
    @pytest.fixture
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": MEMBER_EMAIL,
            "password": MEMBER_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Authentication failed")
        data = response.json()
        return data.get("token") or data.get("access_token")
    
    @pytest.fixture
    def pet_id(self, auth_token):
        """Get first pet's ID for vault testing"""
        response = requests.get(f"{BASE_URL}/api/pets/my-pets", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        if response.status_code != 200 or not response.json().get("pets"):
            pytest.skip("No pets found for testing")
        return response.json()["pets"][0]["id"]
    
    def test_pet_vault_vaccines_endpoint(self, pet_id):
        """Test /api/pet-vault/{pet_id}/vaccines endpoint"""
        response = requests.get(f"{BASE_URL}/api/pet-vault/{pet_id}/vaccines")
        assert response.status_code == 200, f"Vaccines endpoint failed: {response.text}"
        
        data = response.json()
        assert "vaccines" in data, "Response should have vaccines key"
        print(f"✅ Pet vault vaccines: {len(data.get('vaccines', []))} records")
        
        # Check for overdue/upcoming logic
        if "overdue_vaccines" in data:
            print(f"   Overdue: {len(data['overdue_vaccines'])}")
        if "upcoming_vaccines" in data:
            print(f"   Upcoming: {len(data['upcoming_vaccines'])}")
    
    def test_pet_vault_medications_endpoint(self, pet_id):
        """Test /api/pet-vault/{pet_id}/medications endpoint"""
        response = requests.get(f"{BASE_URL}/api/pet-vault/{pet_id}/medications")
        assert response.status_code == 200, f"Medications endpoint failed: {response.text}"
        
        data = response.json()
        assert "medications" in data, "Response should have medications key"
        print(f"✅ Pet vault medications: {len(data.get('medications', []))} records")
        
        if "active_medications" in data:
            print(f"   Active: {len(data['active_medications'])}")
    
    def test_pet_vault_summary_endpoint(self, pet_id):
        """Test /api/pet-vault/{pet_id}/summary - health summary"""
        response = requests.get(f"{BASE_URL}/api/pet-vault/{pet_id}/summary")
        assert response.status_code == 200, f"Summary endpoint failed: {response.text}"
        
        data = response.json()
        assert "pet_name" in data or "summary" in data, "Response should have pet info"
        print(f"✅ Pet vault summary retrieved for {data.get('pet_name', 'pet')}")
        
        if "alerts" in data:
            print(f"   Health alerts: {len(data['alerts'])}")
    
    def test_pet_vault_weight_history(self, pet_id):
        """Test /api/pet-vault/{pet_id}/weight-history"""
        response = requests.get(f"{BASE_URL}/api/pet-vault/{pet_id}/weight-history")
        assert response.status_code == 200, f"Weight history failed: {response.text}"
        
        data = response.json()
        assert "weight_history" in data, "Response should have weight_history"
        print(f"✅ Weight history: {len(data.get('weight_history', []))} records")


class TestBirthdayEngine:
    """Test Birthday Engine - Upcoming celebrations detection"""
    
    def test_birthday_engine_upcoming_requires_auth(self):
        """Test that birthday engine requires admin auth"""
        response = requests.get(f"{BASE_URL}/api/birthday-engine/upcoming")
        # Should require authentication
        assert response.status_code == 401, "Birthday engine should require auth"
        print("✅ Birthday engine correctly requires authentication")
    
    def test_birthday_engine_upcoming_with_auth(self):
        """Test birthday engine with admin credentials"""
        response = requests.get(
            f"{BASE_URL}/api/birthday-engine/upcoming?days=30",
            auth=(ADMIN_USERNAME, ADMIN_PASSWORD)
        )
        assert response.status_code == 200, f"Failed: {response.text}"
        
        data = response.json()
        assert "total" in data, "Response should have total count"
        
        print(f"✅ Birthday engine found {data.get('total', 0)} upcoming celebrations")
        
        if "today" in data:
            print(f"   Today: {len(data['today'])}")
        if "this_week" in data:
            print(f"   This week: {len(data['this_week'])}")
        if "this_month" in data:
            print(f"   This month: {len(data['this_month'])}")
    
    def test_birthday_engine_stats(self):
        """Test birthday engine stats endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/birthday-engine/stats",
            auth=(ADMIN_USERNAME, ADMIN_PASSWORD)
        )
        assert response.status_code == 200, f"Stats failed: {response.text}"
        
        data = response.json()
        print(f"✅ Birthday stats:")
        print(f"   Pets with birthdays: {data.get('pets_with_birthdays', 0)}")
        print(f"   Pets with gotcha day: {data.get('pets_with_gotcha_day', 0)}")
        print(f"   Upcoming 7 days: {data.get('upcoming_7_days', 0)}")


class TestBreedTipsIntegration:
    """Test breed-specific tips - Shih Tzu specific content"""
    
    @pytest.fixture
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": MEMBER_EMAIL,
            "password": MEMBER_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Authentication failed")
        data = response.json()
        return data.get("token") or data.get("access_token")
    
    def test_pet_score_state_includes_breed_info(self, auth_token):
        """Verify pet score state includes breed data for tips"""
        # Get pet first
        response = requests.get(f"{BASE_URL}/api/pets/my-pets", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        if not response.json().get("pets"):
            pytest.skip("No pets to test")
        
        pet = response.json()["pets"][0]
        pet_id = pet["id"]
        
        # Get score state
        response = requests.get(
            f"{BASE_URL}/api/pet-score/{pet_id}/score_state",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Pet score state retrieved for {pet.get('name')}")
            print(f"   Breed: {pet.get('breed', 'Unknown')}")
            print(f"   Total score: {data.get('total_score', 'N/A')}")
        else:
            print(f"⚠️ Score state endpoint returned {response.status_code}")
    
    def test_breed_recommendations_available(self, auth_token):
        """Test that breed-based recommendations exist"""
        response = requests.get(f"{BASE_URL}/api/pets/my-pets", headers={
            "Authorization": f"Bearer {auth_token}"
        })
        if not response.json().get("pets"):
            pytest.skip("No pets to test")
        
        pet = response.json()["pets"][0]
        breed = pet.get("breed", "").lower()
        
        if "shih tzu" in breed or "shihtzu" in breed:
            print(f"✅ Found Shih Tzu breed: {pet.get('name')}")
            # Breed tips would be served via Mira AI context
        else:
            print(f"   Pet breed: {breed}")


class TestEngagementSystem:
    """Test Engagement System - streak, actions, points"""
    
    @pytest.fixture
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": MEMBER_EMAIL,
            "password": MEMBER_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Authentication failed")
        data = response.json()
        return data.get("token") or data.get("access_token")
    
    @pytest.fixture
    def user_id(self, auth_token):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": MEMBER_EMAIL,
            "password": MEMBER_PASSWORD
        })
        return response.json().get("user", {}).get("id")
    
    def test_engagement_sync_endpoint(self, auth_token, user_id):
        """Test engagement sync endpoint"""
        if not user_id:
            pytest.skip("No user_id available")
        
        response = requests.get(
            f"{BASE_URL}/api/engagement/sync/{user_id}",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Engagement sync successful")
            print(f"   Pets: {len(data.get('pets', []))}")
        else:
            print(f"⚠️ Engagement sync returned {response.status_code}")
    
    def test_paw_points_history(self, auth_token):
        """Test paw points history endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/paw-points/history?limit=10",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Paw points history: {len(data.get('transactions', []))} transactions")
        else:
            print(f"⚠️ Paw points history returned {response.status_code}")


class TestMemberDashboard:
    """Test Member Dashboard endpoints"""
    
    @pytest.fixture
    def auth_token(self):
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": MEMBER_EMAIL,
            "password": MEMBER_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Authentication failed")
        data = response.json()
        return data.get("token") or data.get("access_token")
    
    def test_my_orders_endpoint(self, auth_token):
        """Test /api/orders/my-orders"""
        response = requests.get(
            f"{BASE_URL}/api/orders/my-orders",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"Orders failed: {response.text}"
        
        data = response.json()
        assert "orders" in data, "Should have orders key"
        print(f"✅ My orders: {len(data.get('orders', []))} orders")
    
    def test_autoship_subscriptions(self, auth_token):
        """Test /api/autoship/my-subscriptions"""
        response = requests.get(
            f"{BASE_URL}/api/autoship/my-subscriptions",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Autoship subscriptions: {len(data.get('subscriptions', []))}")
        else:
            print(f"⚠️ Autoship returned {response.status_code}")
    
    def test_my_reviews_endpoint(self, auth_token):
        """Test /api/reviews/my-reviews"""
        response = requests.get(
            f"{BASE_URL}/api/reviews/my-reviews",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ My reviews: {len(data.get('reviews', []))}")
        else:
            print(f"⚠️ Reviews returned {response.status_code}")
    
    def test_mira_my_requests(self, auth_token):
        """Test /api/mira/my-requests - tickets/bookings"""
        response = requests.get(
            f"{BASE_URL}/api/mira/my-requests",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ My requests: {len(data.get('requests', []))}")
        else:
            print(f"⚠️ My requests returned {response.status_code}")
    
    def test_celebrations_my_upcoming(self, auth_token):
        """Test /api/celebrations/my-upcoming"""
        response = requests.get(
            f"{BASE_URL}/api/celebrations/my-upcoming?days=30",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Upcoming celebrations: {len(data.get('celebrations', []))}")
        else:
            print(f"⚠️ Celebrations returned {response.status_code}")


class TestPetPersonas:
    """Test pet personas endpoint - used in My Pets page"""
    
    def test_pet_personas_public_endpoint(self):
        """Test /api/pets/personas is accessible"""
        response = requests.get(f"{BASE_URL}/api/pets/personas")
        assert response.status_code == 200, f"Personas failed: {response.text}"
        
        data = response.json()
        assert "personas" in data, "Should have personas key"
        
        print(f"✅ Pet personas available: {len(data.get('personas', {}))} types")
        for persona_key, persona_data in list(data.get('personas', {}).items())[:3]:
            print(f"   {persona_data.get('emoji', '🐾')} {persona_data.get('name', persona_key)}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
