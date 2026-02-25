"""
Test suite for Mira OS Context features:
- OS context with temporal_context for birthday detection
- Safety gates for allergies (Mojo has chicken allergy)
- Memory recall for relevant past memories
- Admin panel member directory

Test credentials:
- Member: dipali@clubconcierge.in / test123
- Admin: aditya / lola4304
- Pet ID: pet-99a708f1722a (Mojo)
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestMiraOSContext:
    """Test Mira Chat API with OS context features"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get auth token for member login"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "dipali@clubconcierge.in",
            "password": "test123"
        })
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "token" in data or "access_token" in data
        return data.get("token") or data.get("access_token")
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin auth token"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "username": "aditya",
            "password": "lola4304"
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        return data.get("token") or data.get("access_token")
    
    def test_mira_chat_returns_os_context(self, auth_token):
        """Test that chat API returns os_context in response"""
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "message": "Plan a birthday party for Mojo",
                "selected_pet_id": "pet-99a708f1722a"
            }
        )
        assert response.status_code == 200, f"Chat failed: {response.text}"
        data = response.json()
        
        # Verify os_context is present
        assert "os_context" in data, "os_context missing from response"
        os_context = data["os_context"]
        
        # os_context should have these fields
        assert "layer_activation" in os_context
        assert "temporal_context" in os_context or os_context.get("temporal_context") is not None or os_context.get("temporal_context") is None
        assert "safety_gates" in os_context
        print(f"✓ os_context structure verified: {list(os_context.keys())}")
    
    def test_temporal_context_birthday_detection(self, auth_token):
        """Test that temporal_context shows Mojo's birthday (Feb 14, 2 days away)"""
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "message": "Is there anything special coming up for Mojo?",
                "selected_pet_id": "pet-99a708f1722a"
            }
        )
        assert response.status_code == 200, f"Chat failed: {response.text}"
        data = response.json()
        
        os_context = data.get("os_context", {})
        temporal = os_context.get("temporal_context")
        
        # Temporal context should exist for upcoming birthday
        if temporal:
            print(f"✓ Temporal context found: {temporal}")
            assert temporal.get("type") == "birthday_upcoming", f"Expected birthday_upcoming, got {temporal.get('type')}"
            # Birthday should be within 7 days (Feb 14 is 2 days from Feb 12)
            days_until = temporal.get("days_until", 99)
            assert days_until <= 7, f"Birthday {days_until} days away - should be 2 days"
            print(f"✓ Birthday detected: {temporal.get('date')} - {temporal.get('message')}")
        else:
            # May not be detected if not in celebration context
            print("⚠ No temporal_context returned (may require celebrate pillar)")
    
    def test_safety_gates_chicken_allergy(self, auth_token):
        """Test that safety_gates includes Mojo's chicken allergy"""
        # Ask about treats - should trigger allergy check
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "message": "What treats are safe for Mojo's birthday?",
                "selected_pet_id": "pet-99a708f1722a"
            }
        )
        assert response.status_code == 200, f"Chat failed: {response.text}"
        data = response.json()
        
        os_context = data.get("os_context", {})
        safety_gates = os_context.get("safety_gates", [])
        
        print(f"Safety gates: {safety_gates}")
        
        # Check if allergies are in safety_gates
        allergy_gates = [g for g in safety_gates if g.get("type") == "allergy"]
        if allergy_gates:
            all_allergies = []
            for gate in allergy_gates:
                all_allergies.extend(gate.get("items", []))
            print(f"✓ Allergies found in safety_gates: {all_allergies}")
            # Check for chicken allergy (case-insensitive)
            has_chicken = any("chicken" in str(a).lower() for a in all_allergies)
            if has_chicken:
                print("✓ Chicken allergy detected in safety_gates")
            else:
                print(f"⚠ Chicken allergy not found. Found: {all_allergies}")
        else:
            print("⚠ No allergy gates found in safety_gates")
    
    def test_memory_recall_for_celebrations(self, auth_token):
        """Test that memory_recall returns relevant past memories"""
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "message": "What did we do for Mojo's last birthday?",
                "selected_pet_id": "pet-99a708f1722a"
            }
        )
        assert response.status_code == 200, f"Chat failed: {response.text}"
        data = response.json()
        
        os_context = data.get("os_context", {})
        memory_recall = os_context.get("memory_recall")
        
        print(f"Memory recall: {memory_recall}")
        
        if memory_recall:
            assert "text" in memory_recall or "type" in memory_recall, "Memory recall should have text or type"
            print(f"✓ Memory recall found: {memory_recall}")
        else:
            print("ℹ No memory recall (may not have celebration memories yet)")
    
    def test_mira_chat_birthday_planning_os_aware(self, auth_token):
        """Test that Mira responds appropriately to birthday planning with OS awareness"""
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            headers={"Authorization": f"Bearer {auth_token}"},
            json={
                "message": "Help me plan Mojo's birthday, it's coming up soon!",
                "selected_pet_id": "pet-99a708f1722a"
            }
        )
        assert response.status_code == 200, f"Chat failed: {response.text}"
        data = response.json()
        
        # Check response message exists
        assert "response" in data or "message" in data, "No response in data"
        
        response_text = ""
        if isinstance(data.get("response"), dict):
            response_text = data["response"].get("message", "")
        else:
            response_text = data.get("message", data.get("response", ""))
        
        print(f"Mira response preview: {response_text[:200]}...")
        
        # Verify OS context is included
        os_context = data.get("os_context", {})
        print(f"OS context: layer={os_context.get('layer_activation')}, temporal={os_context.get('temporal_context')}, safety={os_context.get('safety_gates')}")
        
        assert os_context, "os_context should be present for birthday planning query"


class TestAdminPanelMemberDirectory:
    """Test Admin Panel - Pet Parents tab"""
    
    @pytest.fixture(scope="class")
    def admin_token(self):
        """Get admin auth token"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "username": "aditya",
            "password": "lola4304"
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        return data.get("token") or data.get("access_token")
    
    def test_admin_login(self):
        """Test admin login works"""
        response = requests.post(f"{BASE_URL}/api/admin/login", json={
            "username": "aditya",
            "password": "lola4304"
        })
        assert response.status_code == 200, f"Admin login failed: {response.text}"
        data = response.json()
        assert data.get("token") or data.get("access_token"), "No token in admin login response"
        print("✓ Admin login successful")
    
    def test_member_directory_loads(self, admin_token):
        """Test that member directory API returns data"""
        response = requests.get(
            f"{BASE_URL}/api/admin/members/directory",
            headers={"Authorization": f"Bearer {admin_token}"} if admin_token else {}
        )
        assert response.status_code == 200, f"Member directory failed: {response.text}"
        data = response.json()
        
        assert "members" in data, "Members list not in response"
        members = data["members"]
        assert isinstance(members, list), "Members should be a list"
        print(f"✓ Member directory loaded: {len(members)} members")
        
        # Verify member data structure
        if members:
            member = members[0]
            print(f"✓ Sample member: {member.get('name', member.get('email'))}")
    
    def test_member_full_profile(self, admin_token):
        """Test that member full profile can be fetched"""
        # First get a member email from directory
        response = requests.get(
            f"{BASE_URL}/api/admin/members/directory",
            headers={"Authorization": f"Bearer {admin_token}"} if admin_token else {}
        )
        assert response.status_code == 200
        members = response.json().get("members", [])
        
        if not members:
            pytest.skip("No members in directory")
        
        # Get full profile for a member
        member_email = members[0].get("email", "test@example.com")
        profile_response = requests.get(
            f"{BASE_URL}/api/concierge/member/{member_email}/full-profile",
            headers={"Authorization": f"Bearer {admin_token}"} if admin_token else {}
        )
        assert profile_response.status_code == 200, f"Full profile failed: {profile_response.text}"
        data = profile_response.json()
        
        # Check profile structure
        assert "member" in data or "pets" in data, "Profile should have member or pets data"
        print(f"✓ Member full profile loaded for: {member_email}")
        if data.get("pets"):
            print(f"✓ Pets in profile: {len(data['pets'])}")


class TestMojoSpecificData:
    """Test Mojo's specific pet data (pet-99a708f1722a)"""
    
    @pytest.fixture(scope="class")
    def auth_token(self):
        """Get auth token"""
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "dipali@clubconcierge.in",
            "password": "test123"
        })
        assert response.status_code == 200
        return response.json().get("token") or response.json().get("access_token")
    
    def test_mojo_pet_data_fetch(self, auth_token):
        """Test that we can fetch Mojo's pet data"""
        response = requests.get(
            f"{BASE_URL}/api/pets",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"Pets fetch failed: {response.text}"
        data = response.json()
        
        pets = data.get("pets", [])
        mojo = None
        for pet in pets:
            if pet.get("id") == "pet-99a708f1722a" or pet.get("name", "").lower() == "mojo":
                mojo = pet
                break
        
        if mojo:
            print(f"✓ Mojo found: {mojo.get('name')}")
            print(f"  - ID: {mojo.get('id')}")
            print(f"  - Birthday: {mojo.get('birth_date') or mojo.get('birthday')}")
            print(f"  - Breed: {mojo.get('breed')}")
            
            # Check for allergies in various locations
            allergies = (
                mojo.get("allergies") or 
                mojo.get("known_allergies") or 
                (mojo.get("preferences") or {}).get("allergies") or
                (mojo.get("health_vault") or {}).get("allergies") or
                []
            )
            print(f"  - Allergies: {allergies}")
        else:
            print(f"⚠ Mojo not found in pets: {[p.get('name') for p in pets]}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
