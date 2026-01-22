"""
Test Suite for Family Dashboard and Mira Memory Features
=========================================================
Tests:
1. Mira Memory API endpoints (/api/mira/memory/stats, /api/mira/memory/admin/member/{email})
2. Family Dashboard related endpoints
3. Memory Timeline data retrieval
4. Admin Reminders endpoints
"""

import pytest
import requests
import os
from datetime import datetime

# Get BASE_URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "dipali@clubconcierge.in"
TEST_PASSWORD = "lola4304"
ADMIN_USERNAME = "aditya"
ADMIN_PASSWORD = "lola4304"


class TestHealthCheck:
    """Basic health check"""
    
    def test_api_health(self):
        """Test API is healthy"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        print(f"✓ API health check passed: {data}")


class TestUserAuth:
    """Authentication tests"""
    
    def test_user_login(self):
        """Test user login and get token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data or "access_token" in data
        print(f"✓ User login successful for {TEST_EMAIL}")
        return data.get("token") or data.get("access_token")


class TestMiraMemoryStats:
    """Test Mira Memory Stats endpoint"""
    
    def test_memory_stats_endpoint(self):
        """Test /api/mira/memory/stats returns stats"""
        response = requests.get(f"{BASE_URL}/api/mira/memory/stats")
        assert response.status_code == 200, f"Memory stats failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "total_memories" in data, "Missing total_memories field"
        assert "by_type" in data, "Missing by_type field"
        assert "members_with_memories" in data, "Missing members_with_memories field"
        
        print(f"✓ Memory stats: total={data.get('total_memories')}, members={data.get('members_with_memories')}")
        print(f"  By type: {data.get('by_type')}")
        return data


class TestMiraMemoryAdmin:
    """Test Mira Memory Admin endpoints"""
    
    def test_admin_get_member_memories(self):
        """Test /api/mira/memory/admin/member/{email} returns member memories"""
        response = requests.get(
            f"{BASE_URL}/api/mira/memory/admin/member/{TEST_EMAIL}",
            params={"include_inactive": "true"}
        )
        assert response.status_code == 200, f"Admin member memories failed: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "member_id" in data, "Missing member_id field"
        assert "total_memories" in data, "Missing total_memories field"
        assert "by_type" in data, "Missing by_type field"
        
        print(f"✓ Admin member memories for {TEST_EMAIL}:")
        print(f"  Total memories: {data.get('total_memories')}")
        
        # Check memory types
        by_type = data.get("by_type", {})
        for mtype, type_data in by_type.items():
            count = type_data.get("count", 0)
            if count > 0:
                print(f"  - {mtype}: {count} memories")
        
        return data
    
    def test_admin_add_memory(self):
        """Test adding a memory via admin endpoint"""
        memory_content = f"TEST_memory_created_at_{datetime.now().isoformat()}"
        
        response = requests.post(
            f"{BASE_URL}/api/mira/memory/admin/member/{TEST_EMAIL}",
            json={
                "content": memory_content,
                "memory_type": "general",
                "pet_name": "Test Pet"
            }
        )
        assert response.status_code == 200, f"Admin add memory failed: {response.text}"
        data = response.json()
        
        assert data.get("success") == True, "Memory creation not successful"
        assert "memory_id" in data, "Missing memory_id in response"
        
        print(f"✓ Admin added memory: {data.get('memory_id')}")
        return data.get("memory_id")


class TestMiraMemoryInternal:
    """Test internal memory endpoints"""
    
    def test_get_relevant_memories(self):
        """Test /api/mira/memory/internal/relevant endpoint"""
        response = requests.get(
            f"{BASE_URL}/api/mira/memory/internal/relevant",
            params={
                "member_id": TEST_EMAIL,
                "context": "birthday celebration planning",
                "limit": 5
            }
        )
        assert response.status_code == 200, f"Get relevant memories failed: {response.text}"
        data = response.json()
        
        assert "memories" in data, "Missing memories field"
        assert "formatted_prompt" in data, "Missing formatted_prompt field"
        
        print(f"✓ Relevant memories: {len(data.get('memories', []))} found")
        return data


class TestHouseholdEndpoint:
    """Test household/family dashboard endpoints"""
    
    def test_household_endpoint(self):
        """Test /api/household/{member_id} endpoint"""
        response = requests.get(f"{BASE_URL}/api/household/{TEST_EMAIL}")
        
        # This endpoint may return 404 if not implemented or no household data
        if response.status_code == 404:
            print("⚠ Household endpoint returned 404 - may not be implemented")
            return None
        
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Household data: {data}")
            return data
        
        print(f"⚠ Household endpoint returned {response.status_code}: {response.text}")
        return None


class TestMyPetsEndpoint:
    """Test My Pets endpoint for Family Dashboard"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code == 200:
            data = response.json()
            return data.get("token") or data.get("access_token")
        return None
    
    def test_my_pets_endpoint(self, auth_token):
        """Test /api/pets/my-pets returns pets with soul data"""
        if not auth_token:
            pytest.skip("Auth token not available")
        
        response = requests.get(
            f"{BASE_URL}/api/pets/my-pets",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"My pets failed: {response.text}"
        data = response.json()
        
        assert "pets" in data, "Missing pets field"
        pets = data.get("pets", [])
        
        print(f"✓ My pets: {len(pets)} pets found")
        
        for pet in pets:
            name = pet.get("name", "Unknown")
            soul = pet.get("soul", {}) or pet.get("doggy_soul_answers", {})
            soul_score = pet.get("overall_score", 0)
            print(f"  - {name}: Soul score {soul_score}%, has soul data: {bool(soul)}")
        
        return data


class TestPetVaultVaccines:
    """Test Pet Vault vaccines for Family Dashboard upcoming moments"""
    
    def test_get_pet_vaccines(self):
        """Test /api/pet-vault/{pet_id}/vaccines endpoint"""
        # First get a pet ID
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code != 200:
            pytest.skip("Could not login")
        
        token = response.json().get("token") or response.json().get("access_token")
        
        pets_response = requests.get(
            f"{BASE_URL}/api/pets/my-pets",
            headers={"Authorization": f"Bearer {token}"}
        )
        if pets_response.status_code != 200:
            pytest.skip("Could not get pets")
        
        pets = pets_response.json().get("pets", [])
        if not pets:
            pytest.skip("No pets found")
        
        pet_id = pets[0].get("id")
        pet_name = pets[0].get("name")
        
        # Get vaccines
        vaccine_response = requests.get(f"{BASE_URL}/api/pet-vault/{pet_id}/vaccines")
        assert vaccine_response.status_code == 200, f"Get vaccines failed: {vaccine_response.text}"
        
        data = vaccine_response.json()
        vaccines = data.get("vaccines", [])
        
        print(f"✓ Vaccines for {pet_name}: {len(vaccines)} records")
        for v in vaccines[:3]:
            print(f"  - {v.get('vaccine_name')}: due {v.get('next_due_date', 'N/A')}")
        
        return data


class TestCommunicationsReminders:
    """Test Automated Reminders endpoints"""
    
    def test_vaccine_alerts_endpoint(self):
        """Test /api/admin/communications/vaccine-alerts endpoint"""
        response = requests.get(f"{BASE_URL}/api/admin/communications/vaccine-alerts")
        
        if response.status_code == 404:
            print("⚠ Vaccine alerts endpoint not found")
            return None
        
        assert response.status_code == 200, f"Vaccine alerts failed: {response.text}"
        data = response.json()
        
        print(f"✓ Vaccine alerts: {data.get('count', 0)} alerts")
        return data
    
    def test_birthday_reminders_endpoint(self):
        """Test /api/admin/communications/birthday-reminders endpoint"""
        response = requests.get(f"{BASE_URL}/api/admin/communications/birthday-reminders")
        
        if response.status_code == 404:
            print("⚠ Birthday reminders endpoint not found")
            return None
        
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Birthday reminders: {data}")
            return data
        
        print(f"⚠ Birthday reminders returned {response.status_code}")
        return None


class TestCelebrationsUpcoming:
    """Test upcoming celebrations for Family Dashboard"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code == 200:
            data = response.json()
            return data.get("token") or data.get("access_token")
        return None
    
    def test_my_upcoming_celebrations(self, auth_token):
        """Test /api/celebrations/my-upcoming endpoint"""
        if not auth_token:
            pytest.skip("Auth token not available")
        
        response = requests.get(
            f"{BASE_URL}/api/celebrations/my-upcoming",
            params={"days": 30},
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        if response.status_code == 404:
            print("⚠ Celebrations endpoint not found")
            return None
        
        assert response.status_code == 200, f"Celebrations failed: {response.text}"
        data = response.json()
        
        celebrations = data.get("celebrations", [])
        print(f"✓ Upcoming celebrations: {len(celebrations)} in next 30 days")
        
        for c in celebrations[:3]:
            print(f"  - {c.get('pet_name')}: {c.get('occasion_name')} in {c.get('days_until')} days")
        
        return data


class TestMiraMemoryUserEndpoints:
    """Test user-facing memory endpoints"""
    
    @pytest.fixture
    def auth_token(self):
        """Get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if response.status_code == 200:
            data = response.json()
            return data.get("token") or data.get("access_token")
        return None
    
    def test_get_my_memories(self, auth_token):
        """Test /api/mira/memory/me endpoint"""
        if not auth_token:
            pytest.skip("Auth token not available")
        
        response = requests.get(
            f"{BASE_URL}/api/mira/memory/me",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"Get my memories failed: {response.text}"
        data = response.json()
        
        assert "member_id" in data, "Missing member_id"
        assert "total_memories" in data, "Missing total_memories"
        assert "by_type" in data, "Missing by_type"
        
        print(f"✓ My memories: {data.get('total_memories')} total")
        
        by_type = data.get("by_type", {})
        for mtype, type_data in by_type.items():
            count = type_data.get("count", 0)
            if count > 0:
                print(f"  - {mtype}: {count} memories")
        
        return data


class TestCleanup:
    """Cleanup test data"""
    
    def test_cleanup_test_memories(self):
        """Clean up TEST_ prefixed memories"""
        # Get all memories for test user
        response = requests.get(
            f"{BASE_URL}/api/mira/memory/admin/member/{TEST_EMAIL}",
            params={"include_inactive": "true"}
        )
        
        if response.status_code != 200:
            print("⚠ Could not get memories for cleanup")
            return
        
        data = response.json()
        by_type = data.get("by_type", {})
        
        test_memory_ids = []
        for mtype, type_data in by_type.items():
            for memory in type_data.get("memories", []):
                content = memory.get("content", "")
                if content.startswith("TEST_"):
                    test_memory_ids.append(memory.get("memory_id"))
        
        if test_memory_ids:
            # Bulk delete test memories
            delete_response = requests.post(
                f"{BASE_URL}/api/mira/memory/admin/bulk",
                json={
                    "memory_ids": test_memory_ids,
                    "action": "delete"
                }
            )
            if delete_response.status_code == 200:
                print(f"✓ Cleaned up {len(test_memory_ids)} test memories")
            else:
                print(f"⚠ Cleanup failed: {delete_response.text}")
        else:
            print("✓ No test memories to clean up")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
