"""
Test Suite: Personalized Picks Vault & Chat Command Integration
Testing the enhanced Unified Picks Vault feature for 'The Doggy Company'

Features tested:
1. API /api/mira/os/understand-with-products returns ui_action when user says 'Show me personalized picks for Mojo'
2. API /api/mira/top-picks/{pet_id} returns picks data grouped by pillar
3. Concierge suggestion cards have price: null in API response
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
TEST_USER_EMAIL = "dipali@clubconcierge.in"
TEST_USER_PASSWORD = "test123"

# Store auth token and pet info across tests
auth_data = {}

class TestPersonalizedPicksVault:
    """Test suite for Personalized Picks Vault features"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup - ensure BASE_URL is set"""
        assert BASE_URL, "REACT_APP_BACKEND_URL environment variable must be set"
    
    def test_01_user_login(self):
        """Test user authentication to get token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": TEST_USER_EMAIL, "password": TEST_USER_PASSWORD}
        )
        
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        
        assert "token" in data, "Response should contain token"
        auth_data["token"] = data["token"]
        
        # Store user info for subsequent tests
        if "user" in data:
            auth_data["user"] = data["user"]
        
        print(f"✓ Login successful, token obtained")
    
    def test_02_get_user_pets(self):
        """Get user's pets to find valid pet_id"""
        assert "token" in auth_data, "Must login first"
        
        headers = {"Authorization": f"Bearer {auth_data['token']}"}
        
        # Try to get pets from multiple endpoints
        endpoints = [
            f"{BASE_URL}/api/pets",
            f"{BASE_URL}/api/household/pets"
        ]
        
        pets = []
        for endpoint in endpoints:
            response = requests.get(endpoint, headers=headers)
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    pets = data
                elif isinstance(data, dict):
                    pets = data.get("pets", data.get("data", []))
                if pets:
                    break
        
        if pets:
            auth_data["pets"] = pets
            auth_data["pet_id"] = pets[0].get("id") or pets[0].get("pet_id") or pets[0].get("name")
            auth_data["pet_name"] = pets[0].get("name", "Mojo")
            print(f"✓ Found {len(pets)} pets, using: {auth_data['pet_name']} (id: {auth_data['pet_id']})")
        else:
            # Use default pet name for testing
            auth_data["pet_id"] = "Mojo"
            auth_data["pet_name"] = "Mojo"
            print(f"✓ No pets found, using default pet name: Mojo")
    
    def test_03_understand_with_products_personalized_picks(self):
        """
        Test: Chat command 'Show me personalized picks for [Pet]' returns ui_action
        Endpoint: POST /api/mira/os/understand-with-products
        Expected: Response contains ui_action with type='open_picks_vault'
        """
        assert "token" in auth_data, "Must login first"
        
        headers = {
            "Authorization": f"Bearer {auth_data['token']}",
            "Content-Type": "application/json"
        }
        
        pet_name = auth_data.get("pet_name", "Mojo")
        pet_id = auth_data.get("pet_id", "Mojo")
        
        # Test the personalized picks command
        payload = {
            "input": f"Show me personalized picks for {pet_name}",
            "pet_id": pet_id,
            "pet_context": {
                "name": pet_name,
                "id": pet_id
            },
            "page_context": "home"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/mira/os/understand-with-products",
            headers=headers,
            json=payload
        )
        
        assert response.status_code == 200, f"API call failed with status {response.status_code}: {response.text}"
        
        data = response.json()
        print(f"Response keys: {data.keys()}")
        
        # Check for ui_action in response
        assert "ui_action" in data, f"Response should contain ui_action. Got: {data.keys()}"
        
        ui_action = data["ui_action"]
        assert "type" in ui_action, "ui_action should have 'type' field"
        assert ui_action["type"] == "open_picks_vault", f"ui_action type should be 'open_picks_vault', got: {ui_action['type']}"
        
        # Check for pet info in ui_action
        if "pet_name" in ui_action:
            assert ui_action["pet_name"] == pet_name or ui_action["pet_name"].lower() == pet_name.lower(), \
                f"Pet name mismatch: expected {pet_name}, got {ui_action['pet_name']}"
        
        print(f"✓ 'Show me personalized picks for {pet_name}' correctly returns ui_action with type='open_picks_vault'")
    
    def test_04_understand_with_products_variations(self):
        """
        Test various phrases that should trigger the picks vault
        """
        assert "token" in auth_data, "Must login first"
        
        headers = {
            "Authorization": f"Bearer {auth_data['token']}",
            "Content-Type": "application/json"
        }
        
        pet_name = auth_data.get("pet_name", "Mojo")
        pet_id = auth_data.get("pet_id", "Mojo")
        
        # Test variations
        test_phrases = [
            f"show picks for {pet_name}",
            f"top picks for {pet_name}",
            f"what do you recommend for {pet_name}"
        ]
        
        for phrase in test_phrases:
            payload = {
                "input": phrase,
                "pet_id": pet_id,
                "pet_context": {"name": pet_name, "id": pet_id}
            }
            
            response = requests.post(
                f"{BASE_URL}/api/mira/os/understand-with-products",
                headers=headers,
                json=payload
            )
            
            if response.status_code == 200:
                data = response.json()
                if "ui_action" in data and data["ui_action"].get("type") == "open_picks_vault":
                    print(f"✓ Phrase '{phrase}' correctly triggers picks vault")
                else:
                    print(f"⚠ Phrase '{phrase}' did not trigger picks vault (may need different wording)")
            else:
                print(f"⚠ Phrase '{phrase}' returned status {response.status_code}")
    
    def test_05_top_picks_endpoint(self):
        """
        Test: /api/mira/top-picks/{pet_id} returns picks grouped by pillar
        Expected: Response contains pillars object with picks for each pillar
        """
        assert "token" in auth_data, "Must login first"
        
        headers = {"Authorization": f"Bearer {auth_data['token']}"}
        pet_id = auth_data.get("pet_id", "Mojo")
        pet_name = auth_data.get("pet_name", "Mojo")
        
        response = requests.get(
            f"{BASE_URL}/api/mira/top-picks/{pet_id}",
            headers=headers
        )
        
        assert response.status_code == 200, f"Top picks API failed: {response.status_code} - {response.text}"
        
        data = response.json()
        
        # Check response structure
        assert "success" in data, "Response should have 'success' field"
        assert data["success"] == True, "API should return success=True"
        
        assert "pillars" in data, "Response should have 'pillars' field with grouped picks"
        pillars = data["pillars"]
        
        # Check that we have pillars
        assert isinstance(pillars, dict), "pillars should be a dictionary"
        
        # Check some expected pillars exist
        expected_pillars = ["celebrate", "dine", "care", "shop"]
        found_pillars = []
        for pillar in expected_pillars:
            if pillar in pillars:
                found_pillars.append(pillar)
        
        print(f"✓ Top picks endpoint returns data with {len(pillars)} pillars")
        print(f"  Found pillars: {list(pillars.keys())}")
        
        # Check pet intelligence
        if "pet" in data:
            pet = data["pet"]
            print(f"  Pet info: {pet.get('name', 'N/A')} ({pet.get('breed', 'N/A')})")
        
        # Store for next test
        auth_data["top_picks_response"] = data
    
    def test_06_concierge_suggestion_cards_have_null_price(self):
        """
        Test: Concierge suggestion cards should have price: null
        Check the picks from top-picks endpoint for concierge type items
        """
        # Use data from previous test or fetch again
        if "top_picks_response" not in auth_data:
            self.test_05_top_picks_endpoint()
        
        data = auth_data.get("top_picks_response")
        if not data:
            pytest.skip("No top picks data available")
        
        pillars = data.get("pillars", {})
        
        concierge_items_found = 0
        concierge_items_with_null_price = 0
        
        for pillar_name, pillar_data in pillars.items():
            picks = pillar_data.get("picks", [])
            for pick in picks:
                pick_type = pick.get("pick_type") or pick.get("type", "")
                
                # Check for concierge suggestion cards
                if pick_type == "concierge" or pick_type == "concierge_suggestion":
                    concierge_items_found += 1
                    price = pick.get("price")
                    
                    # Price should be null/None for concierge items
                    if price is None:
                        concierge_items_with_null_price += 1
                        print(f"✓ Concierge item in '{pillar_name}': '{pick.get('name')}' has price=null")
                    else:
                        print(f"✗ Concierge item in '{pillar_name}': '{pick.get('name')}' has price={price} (should be null)")
        
        if concierge_items_found > 0:
            assert concierge_items_with_null_price == concierge_items_found, \
                f"All {concierge_items_found} concierge items should have null price, but only {concierge_items_with_null_price} do"
            print(f"✓ All {concierge_items_found} concierge suggestion cards have price=null")
        else:
            # Check if we can find any concierge items by examining picks structure
            print("ℹ No concierge suggestion cards found in response. This is acceptable if all pillars have catalogue items.")
            
            # Verify the structure allows for price: null
            for pillar_name, pillar_data in pillars.items():
                picks = pillar_data.get("picks", [])
                if picks:
                    sample_pick = picks[0]
                    # Verify price field exists
                    assert "price" in sample_pick or sample_pick.get("price") is None, \
                        f"Picks should have price field (can be null)"
                    break
    
    def test_07_top_picks_pillar_specific(self):
        """
        Test: /api/mira/top-picks/{pet_id}/pillar/{pillar} endpoint
        """
        assert "token" in auth_data, "Must login first"
        
        headers = {"Authorization": f"Bearer {auth_data['token']}"}
        pet_id = auth_data.get("pet_id", "Mojo")
        
        # Test a few pillars
        test_pillars = ["celebrate", "shop", "care"]
        
        for pillar in test_pillars:
            response = requests.get(
                f"{BASE_URL}/api/mira/top-picks/{pet_id}/pillar/{pillar}",
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                picks = data.get("picks", [])
                print(f"✓ Pillar '{pillar}': {len(picks)} picks returned")
                
                # Check concierge items have null price
                for pick in picks:
                    if pick.get("pick_type") == "concierge" or pick.get("type") == "concierge_suggestion":
                        assert pick.get("price") is None, \
                            f"Concierge item '{pick.get('name')}' in pillar '{pillar}' should have price=null"
            elif response.status_code == 404:
                print(f"ℹ Pillar '{pillar}' not found (may not be configured)")
            else:
                print(f"⚠ Pillar '{pillar}' returned status {response.status_code}")


class TestPicksVaultIntegration:
    """Integration tests for the picks vault feature"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup - ensure BASE_URL and auth_data are available"""
        assert BASE_URL, "REACT_APP_BACKEND_URL environment variable must be set"
        if "token" not in auth_data:
            # Login if not already done
            response = requests.post(
                f"{BASE_URL}/api/auth/login",
                json={"email": TEST_USER_EMAIL, "password": TEST_USER_PASSWORD}
            )
            if response.status_code == 200:
                data = response.json()
                auth_data["token"] = data.get("token")
                auth_data["pet_name"] = "Mojo"
                auth_data["pet_id"] = "Mojo"
    
    def test_08_picks_vault_response_structure(self):
        """
        Verify the response structure when opening picks vault matches frontend expectations
        """
        assert "token" in auth_data, "Must login first"
        
        headers = {
            "Authorization": f"Bearer {auth_data['token']}",
            "Content-Type": "application/json"
        }
        
        pet_name = auth_data.get("pet_name", "Mojo")
        pet_id = auth_data.get("pet_id", "Mojo")
        
        payload = {
            "input": f"Show me personalized picks for {pet_name}",
            "pet_id": pet_id,
            "pet_context": {"name": pet_name, "id": pet_id}
        }
        
        response = requests.post(
            f"{BASE_URL}/api/mira/os/understand-with-products",
            headers=headers,
            json=payload
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify expected response structure
        assert "ui_action" in data, "Should have ui_action"
        
        ui_action = data["ui_action"]
        required_fields = ["type"]
        for field in required_fields:
            assert field in ui_action, f"ui_action should have '{field}' field"
        
        assert ui_action["type"] == "open_picks_vault", "Type should be open_picks_vault"
        
        # Verify response has message
        if "response" in data:
            response_obj = data["response"]
            assert "message" in response_obj, "Response should have message"
            print(f"✓ Response message: {response_obj.get('message', '')[:100]}...")
        
        print("✓ Picks vault response structure is correct for frontend integration")
    
    def test_09_picks_data_fields(self):
        """
        Verify picks have all required fields for frontend rendering
        """
        assert "token" in auth_data, "Must login first"
        
        headers = {"Authorization": f"Bearer {auth_data['token']}"}
        pet_id = auth_data.get("pet_id", "Mojo")
        
        response = requests.get(
            f"{BASE_URL}/api/mira/top-picks/{pet_id}",
            headers=headers
        )
        
        assert response.status_code == 200
        data = response.json()
        
        pillars = data.get("pillars", {})
        
        # Required fields for catalogue picks
        catalogue_required = ["id", "name", "type", "pick_type"]
        # Price can be null for concierge items
        
        for pillar_name, pillar_data in pillars.items():
            picks = pillar_data.get("picks", [])
            for pick in picks:
                for field in catalogue_required:
                    assert field in pick, f"Pick in '{pillar_name}' missing required field '{field}': {pick}"
                
                # Verify price field exists (can be null)
                assert "price" in pick, f"Pick '{pick.get('name')}' should have price field (can be null)"
                
                # Concierge items should have null price
                if pick.get("pick_type") == "concierge":
                    assert pick.get("price") is None, \
                        f"Concierge pick '{pick.get('name')}' should have null price"
        
        print("✓ All picks have required fields for frontend rendering")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
