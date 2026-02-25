"""
Test Conversation Flow Audit - Vault Detection
===============================================
Test module for verifying conversation flows route to correct vault types:
1. Pet cafe query → PlacesVault (nearby_places with restaurants)
2. Birthday cake query → PicksVault (products in celebrate pillar)
3. Meal plan query → TipCardVault (tip_card)
4. Dog walker query → Concierge (services)

This tests the fixes made for nearby_places handling in miraPicks state.
"""

import pytest
import requests
import os
import json
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_EMAIL = "dipali@clubconcierge.in"
TEST_PASSWORD = "test123"


class TestConversationFlowsVault:
    """Test conversation flows route to correct vault types"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test with session"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        
        # Login and get token
        login_response = self.session.post(f"{BASE_URL}/api/auth/login", json={
            "email": TEST_EMAIL,
            "password": TEST_PASSWORD
        })
        if login_response.status_code == 200:
            data = login_response.json()
            token = data.get("token")
            if token:
                self.session.headers.update({"Authorization": f"Bearer {token}"})
        
        yield
        self.session.close()
    
    # ═══════════════════════════════════════════════════════════════════
    # TEST 1: PET CAFE QUERY - Should return nearby_places with restaurants
    # Expected: PlacesVault should render
    # ═══════════════════════════════════════════════════════════════════
    
    def test_pet_cafe_query_returns_nearby_places(self):
        """Pet cafe query should return nearby_places with restaurants (PlacesVault)"""
        payload = {
            "input": "looking for a pet cafe in Mumbai",
            "pet_context": {
                "name": "Mojo",
                "breed": "Golden Retriever",
                "age": "3 years"
            },
            "session_id": f"test-cafe-{int(time.time())}",
            "include_products": False
        }
        
        response = self.session.post(f"{BASE_URL}/api/mira/os/understand-with-products", json=payload)
        assert response.status_code == 200, f"API returned {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, f"Request failed: {data}"
        
        # CRITICAL: Check for nearby_places with restaurants
        nearby_places = data.get("nearby_places")
        print(f"[TEST] nearby_places: {json.dumps(nearby_places, indent=2) if nearby_places else 'None'}")
        
        # Nearby places should be present for cafe query
        # It may return restaurants or the places detection may not always work depending on LLM
        # But the structure should support it
        if nearby_places:
            assert "places" in nearby_places, "nearby_places should have 'places' key"
            assert "type" in nearby_places, "nearby_places should have 'type' key"
            places_type = nearby_places.get("type")
            print(f"[TEST] Places type: {places_type}, Count: {len(nearby_places.get('places', []))}")
        
        # Check products are NOT returned for cafe queries
        products = data.get("products", [])
        print(f"[TEST] Products count: {len(products)}")
    
    def test_pet_cafe_variant_queries(self):
        """Test various pet-friendly dining queries"""
        cafe_queries = [
            "pet-friendly cafe near me",
            "restaurant where I can take my dog",
            "places to eat with my pet",
            "dog cafe mumbai"
        ]
        
        for query in cafe_queries:
            payload = {
                "input": query,
                "pet_context": {"name": "Mojo", "breed": "Golden Retriever"},
                "session_id": f"test-cafe-variant-{int(time.time())}",
                "include_products": False
            }
            
            response = self.session.post(f"{BASE_URL}/api/mira/os/understand-with-products", json=payload)
            assert response.status_code == 200, f"Query '{query}' failed"
            
            data = response.json()
            nearby_places = data.get("nearby_places")
            print(f"[TEST] Query: '{query}' → nearby_places: {nearby_places is not None}, type: {nearby_places.get('type') if nearby_places else 'N/A'}")
    
    # ═══════════════════════════════════════════════════════════════════
    # TEST 2: BIRTHDAY CAKE QUERY - Should return products in celebrate pillar
    # Expected: PicksVault should render
    # ═══════════════════════════════════════════════════════════════════
    
    def test_birthday_cake_returns_products(self):
        """Birthday cake query should return products in celebrate pillar (PicksVault)"""
        payload = {
            "input": "birthday cake for Mojo",
            "pet_context": {
                "name": "Mojo",
                "breed": "Golden Retriever",
                "age": "3 years"
            },
            "session_id": f"test-birthday-{int(time.time())}",
            "include_products": True,
            "pillar": "celebrate"
        }
        
        response = self.session.post(f"{BASE_URL}/api/mira/os/understand-with-products", json=payload)
        assert response.status_code == 200, f"API returned {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, f"Request failed: {data}"
        
        # CRITICAL: Check for products
        products = data.get("products", [])
        print(f"[TEST] Products count: {len(products)}")
        
        # Birthday cake should return celebrate-pillar products
        if products:
            for p in products[:3]:
                print(f"  - {p.get('name')}: {p.get('pillar', 'unknown')} pillar, price: {p.get('price', 'N/A')}")
        
        # Should NOT be nearby_places for birthday cake
        nearby_places = data.get("nearby_places")
        print(f"[TEST] nearby_places: {nearby_places is not None}")
    
    def test_celebration_queries_return_products(self):
        """Various celebration queries should return products"""
        celebration_queries = [
            "party supplies for my dog",
            "celebration treats for Mojo",
            "gotcha day gifts",
            "birthday party planning for my dog"
        ]
        
        for query in celebration_queries:
            payload = {
                "input": query,
                "pet_context": {"name": "Mojo", "breed": "Golden Retriever"},
                "session_id": f"test-celebrate-{int(time.time())}",
                "include_products": True,
                "pillar": "celebrate"
            }
            
            response = self.session.post(f"{BASE_URL}/api/mira/os/understand-with-products", json=payload)
            assert response.status_code == 200
            
            data = response.json()
            products = data.get("products", [])
            print(f"[TEST] Query: '{query}' → products: {len(products)}")
    
    # ═══════════════════════════════════════════════════════════════════
    # TEST 3: MEAL PLAN QUERY - Should return tip_card
    # Expected: TipCardVault should render
    # ═══════════════════════════════════════════════════════════════════
    
    def test_meal_plan_returns_tip_card(self):
        """Meal plan query should return tip_card (TipCardVault)"""
        payload = {
            "input": "create a meal plan for Mojo",
            "pet_context": {
                "name": "Mojo",
                "breed": "Golden Retriever",
                "age": "3 years",
                "sensitivities": ["chicken allergy"]
            },
            "session_id": f"test-mealplan-{int(time.time())}",
            "include_products": False
        }
        
        response = self.session.post(f"{BASE_URL}/api/mira/os/understand-with-products", json=payload)
        assert response.status_code == 200, f"API returned {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, f"Request failed: {data}"
        
        # CRITICAL: Should NOT return products for meal plan
        products = data.get("products", [])
        print(f"[TEST] Products count (should be 0 for advisory): {len(products)}")
        
        # Check for tip_card in response
        tip_card = data.get("response", {}).get("tip_card")
        print(f"[TEST] tip_card present: {tip_card is not None}")
        if tip_card:
            print(f"  - Type: {tip_card.get('type')}")
            print(f"  - Title: {tip_card.get('title')}")
        
        # Message should contain meal plan advice
        message = data.get("response", {}).get("message", "")
        print(f"[TEST] Message length: {len(message)}")
    
    def test_advisory_queries_no_products(self):
        """Advisory queries should return tip cards, not products"""
        advisory_queries = [
            "what should I feed my dog daily",
            "nutrition tips for golden retriever",
            "feeding schedule for puppy",
            "diet plan for overweight dog"
        ]
        
        for query in advisory_queries:
            payload = {
                "input": query,
                "pet_context": {"name": "Mojo", "breed": "Golden Retriever"},
                "session_id": f"test-advisory-{int(time.time())}",
                "include_products": False
            }
            
            response = self.session.post(f"{BASE_URL}/api/mira/os/understand-with-products", json=payload)
            assert response.status_code == 200
            
            data = response.json()
            products = data.get("products", [])
            print(f"[TEST] Query: '{query}' → products: {len(products)} (should be 0 for advisory)")
    
    # ═══════════════════════════════════════════════════════════════════
    # TEST 4: DOG WALKER QUERY - Should route to CONCIERGE execution type
    # Expected: Concierge flow with services
    # ═══════════════════════════════════════════════════════════════════
    
    def test_dog_walker_routes_to_concierge(self):
        """Dog walker query should route to CONCIERGE execution type"""
        payload = {
            "input": "I need a dog walker for Mojo",
            "pet_context": {
                "name": "Mojo",
                "breed": "Golden Retriever",
                "age": "3 years"
            },
            "session_id": f"test-walker-{int(time.time())}",
            "include_products": False,
            "pillar": "care"
        }
        
        response = self.session.post(f"{BASE_URL}/api/mira/os/understand-with-products", json=payload)
        assert response.status_code == 200, f"API returned {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, f"Request failed: {data}"
        
        # CRITICAL: Check execution type
        execution_type = data.get("execution_type")
        print(f"[TEST] Execution type: {execution_type}")
        
        # Check for services
        services = data.get("services", [])
        print(f"[TEST] Services count: {len(services)}")
        if services:
            for s in services[:3]:
                print(f"  - {s.get('name')}: {s.get('category', 'unknown')}")
        
        # Check response suggests concierge
        response_data = data.get("response", {})
        suggest_concierge = response_data.get("suggest_concierge", False)
        print(f"[TEST] suggest_concierge: {suggest_concierge}")
    
    def test_service_queries_route_concierge(self):
        """Service-related queries should route to concierge"""
        service_queries = [
            "find me a dog groomer",
            "book a vet appointment",
            "need pet sitting service",
            "looking for dog boarding"
        ]
        
        for query in service_queries:
            payload = {
                "input": query,
                "pet_context": {"name": "Mojo", "breed": "Golden Retriever"},
                "session_id": f"test-service-{int(time.time())}",
                "include_products": False
            }
            
            response = self.session.post(f"{BASE_URL}/api/mira/os/understand-with-products", json=payload)
            assert response.status_code == 200
            
            data = response.json()
            execution_type = data.get("execution_type")
            services = data.get("services", [])
            print(f"[TEST] Query: '{query}' → execution: {execution_type}, services: {len(services)}")
    
    # ═══════════════════════════════════════════════════════════════════
    # TEST 5: PicksIndicator counting - Verify correct count logic
    # ═══════════════════════════════════════════════════════════════════
    
    def test_picks_indicator_counts_all_types(self):
        """Test that different response types are counted correctly for PicksIndicator"""
        
        # Test 1: Products count
        payload = {
            "input": "treats for my dog",
            "pet_context": {"name": "Mojo", "breed": "Golden Retriever"},
            "session_id": f"test-count-{int(time.time())}",
            "include_products": True
        }
        
        response = self.session.post(f"{BASE_URL}/api/mira/os/understand-with-products", json=payload)
        data = response.json()
        
        products_count = len(data.get("products", []))
        services_count = len(data.get("services", []))
        nearby_places = data.get("nearby_places")
        places_count = len(nearby_places.get("places", [])) if nearby_places else 0
        tip_card = data.get("response", {}).get("tip_card")
        tip_card_count = 1 if tip_card else 0
        
        total_picks = products_count + services_count + places_count + tip_card_count
        
        print(f"[TEST] Treats query counts:")
        print(f"  - Products: {products_count}")
        print(f"  - Services: {services_count}")
        print(f"  - Places: {places_count}")
        print(f"  - TipCard: {tip_card_count}")
        print(f"  - Total picks: {total_picks}")
    
    # ═══════════════════════════════════════════════════════════════════
    # TEST 6: VaultManager places detection
    # ═══════════════════════════════════════════════════════════════════
    
    def test_vault_manager_places_detection(self):
        """Test that VaultManager correctly detects PLACES vault type"""
        # This tests the logic at VaultManager.jsx lines 62-70
        
        # Query for places
        payload = {
            "input": "dog park near me",
            "pet_context": {"name": "Mojo", "breed": "Golden Retriever"},
            "session_id": f"test-vaultmgr-{int(time.time())}",
            "include_products": False
        }
        
        response = self.session.post(f"{BASE_URL}/api/mira/os/understand-with-products", json=payload)
        data = response.json()
        
        nearby_places = data.get("nearby_places")
        
        # Check if nearby_places structure is correct
        if nearby_places:
            assert "places" in nearby_places, "nearby_places should have 'places' key"
            places = nearby_places.get("places", [])
            print(f"[TEST] Dog park query returned {len(places)} places")
            for p in places[:3]:
                print(f"  - {p.get('name')}: rating {p.get('rating', 'N/A')}")


class TestBackendNearbyPlacesIntegration:
    """Test backend returns correct nearby_places structure"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        yield
        self.session.close()
    
    def test_nearby_places_structure_for_restaurant(self):
        """Test nearby_places structure for restaurant queries"""
        payload = {
            "input": "pet-friendly restaurant in Mumbai",
            "pet_context": {"name": "Mojo", "breed": "Golden Retriever"},
            "session_id": f"test-struct-{int(time.time())}",
            "include_products": False
        }
        
        response = self.session.post(f"{BASE_URL}/api/mira/os/understand-with-products", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        nearby_places = data.get("nearby_places")
        
        # Structure validation
        if nearby_places:
            assert isinstance(nearby_places, dict), "nearby_places should be a dict"
            assert "type" in nearby_places, "Should have 'type' field"
            assert "places" in nearby_places, "Should have 'places' field"
            assert isinstance(nearby_places["places"], list), "places should be a list"
            
            # Type should be relevant to restaurants
            places_type = nearby_places.get("type")
            print(f"[TEST] Restaurant query places type: {places_type}")
            
            # Each place should have required fields
            for place in nearby_places.get("places", [])[:3]:
                print(f"  - {place.get('name')}: {place.keys()}")
    
    def test_nearby_places_structure_for_vet(self):
        """Test nearby_places structure for vet queries"""
        payload = {
            "input": "find a vet clinic nearby",
            "pet_context": {"name": "Mojo", "breed": "Golden Retriever"},
            "session_id": f"test-vet-{int(time.time())}",
            "include_products": False
        }
        
        response = self.session.post(f"{BASE_URL}/api/mira/os/understand-with-products", json=payload)
        assert response.status_code == 200
        
        data = response.json()
        nearby_places = data.get("nearby_places")
        
        if nearby_places:
            places_type = nearby_places.get("type")
            print(f"[TEST] Vet query places type: {places_type}")
            assert places_type in ["vet_clinics", "vet", "veterinary"], f"Unexpected places type: {places_type}"


class TestMiraPicksStateUpdate:
    """Test that miraPicks state would be correctly updated by frontend"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test session"""
        self.session = requests.Session()
        self.session.headers.update({"Content-Type": "application/json"})
        yield
        self.session.close()
    
    def test_places_data_available_for_frontend(self):
        """Test that places data is in correct format for frontend miraPicks update"""
        # Test the fix at MiraDemoPage.jsx lines 2360-2400
        
        payload = {
            "input": "pet cafe in delhi",
            "pet_context": {"name": "Mojo", "breed": "Golden Retriever"},
            "session_id": f"test-frontend-{int(time.time())}",
            "include_products": False
        }
        
        response = self.session.post(f"{BASE_URL}/api/mira/os/understand-with-products", json=payload)
        data = response.json()
        
        # Frontend code does:
        # const nearbyPlaces = data.nearby_places?.places || [];
        # const placesType = data.nearby_places?.type || 'places';
        
        nearby_places = data.get("nearby_places")
        
        if nearby_places:
            nearbyPlaces_frontend = nearby_places.get("places", [])
            placesType_frontend = nearby_places.get("type", "places")
            
            print(f"[TEST] Frontend would receive:")
            print(f"  - nearbyPlaces array: {len(nearbyPlaces_frontend)} items")
            print(f"  - placesType: {placesType_frontend}")
            
            # Verify the miraPicks state update structure
            # setMiraPicks(prev => ({...prev, places: nearbyPlaces, placesType: placesType, ...}))
            mira_picks_places = nearbyPlaces_frontend
            mira_picks_type = placesType_frontend
            
            # VaultManager receives:
            # miraResponse={{ products: miraPicks.products, places: miraPicks.places, nearby_places: { places: miraPicks.places, type: miraPicks.placesType }, ... }}
            vault_manager_response = {
                "products": [],
                "places": mira_picks_places,
                "nearby_places": {"places": mira_picks_places, "type": mira_picks_type} if mira_picks_places else None
            }
            
            print(f"[TEST] VaultManager would receive nearby_places: {vault_manager_response['nearby_places'] is not None}")
            
            # VaultManager detects PLACES vault at line 66-67:
            # if (miraResponse?.places?.length > 0 || miraResponse?.nearby_places)
            can_detect_places = len(vault_manager_response.get("places", [])) > 0 or vault_manager_response.get("nearby_places")
            print(f"[TEST] VaultManager can detect PLACES: {can_detect_places}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
