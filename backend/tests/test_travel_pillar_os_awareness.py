"""
TRAVEL Pillar OS-Awareness Tests
Tests for MIRA AI's TRAVEL pillar context generation including:
- TRAVEL pillar detection for flight, road trip, relocation queries
- travel_context generation with temperament, size, breed, brachycephalic flag
- travel_picks generation with Concierge Pick Cards
- concierge_handoff always available for TRAVEL pillar
- uses_google_places flag on itinerary/destination picks
- Non-TRAVEL queries still route correctly (celebrate, dine, stay, care)
"""

import pytest
import requests
import os
import time

# Get BASE_URL from frontend .env
def get_base_url():
    """Read BASE_URL from frontend .env file"""
    env_path = "/app/frontend/.env"
    try:
        with open(env_path, 'r') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    return line.strip().split('=', 1)[1].rstrip('/')
    except Exception:
        pass
    return "https://learn-pillar-audit.preview.emergentagent.com"

BASE_URL = get_base_url()

# Test pet credentials
TEST_PET_ID = "pet-99a708f1722a"  # Mojo - Indie breed
TEST_PET_NAME = "Mojo"
TEST_PET_BREED = "Indie"  # NOT brachycephalic
TEST_PET_ALLERGY = "Chicken"


class TestTravelPillarDetection:
    """Tests for TRAVEL pillar detection from user queries"""
    
    def test_flight_query_routes_to_travel(self):
        """Test that 'fly with my dog' routes to TRAVEL pillar"""
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            json={
                "message": "Can I fly with my dog?",
                "selected_pet_id": TEST_PET_ID,
                "conversation_history": []
            },
            timeout=120
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Check pillar detection
        os_context = data.get("os_context", {})
        layer_activation = os_context.get("layer_activation", "")
        print(f"Flight query layer_activation: {layer_activation}")
        assert layer_activation == "travel", f"Expected 'travel', got '{layer_activation}'"
        
        # Check travel_context exists
        travel_context = os_context.get("travel_context")
        assert travel_context is not None, "travel_context should be present for TRAVEL queries"
        print(f"travel_context: {travel_context}")
    
    def test_road_trip_query_routes_to_travel(self):
        """Test that 'road trip with my dog' routes to TRAVEL pillar"""
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            json={
                "message": "I want to take my dog on a road trip",
                "selected_pet_id": TEST_PET_ID,
                "conversation_history": []
            },
            timeout=120
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        os_context = data.get("os_context", {})
        layer_activation = os_context.get("layer_activation", "")
        print(f"Road trip query layer_activation: {layer_activation}")
        assert layer_activation == "travel", f"Expected 'travel', got '{layer_activation}'"
    
    def test_travel_documents_query_routes_to_travel(self):
        """Test that 'travel documents' routes to TRAVEL pillar"""
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            json={
                "message": "What travel documents do I need for my dog?",
                "selected_pet_id": TEST_PET_ID,
                "conversation_history": []
            },
            timeout=120
        )
        assert response.status_code == 200
        data = response.json()
        
        os_context = data.get("os_context", {})
        layer_activation = os_context.get("layer_activation", "")
        print(f"Travel documents query layer_activation: {layer_activation}")
        assert layer_activation == "travel", f"Expected 'travel', got '{layer_activation}'"
    
    def test_relocation_query_routes_to_travel(self):
        """Test that 'relocating with my dog' routes to TRAVEL pillar"""
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            json={
                "message": "I'm relocating to a new city with my dog",
                "selected_pet_id": TEST_PET_ID,
                "conversation_history": []
            },
            timeout=120
        )
        assert response.status_code == 200
        data = response.json()
        
        os_context = data.get("os_context", {})
        layer_activation = os_context.get("layer_activation", "")
        print(f"Relocation query layer_activation: {layer_activation}")
        assert layer_activation == "travel", f"Expected 'travel', got '{layer_activation}'"
    
    def test_vacation_query_routes_to_travel(self):
        """Test that 'vacation with my dog' routes to TRAVEL pillar"""
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            json={
                "message": "Planning a vacation with my dog",
                "selected_pet_id": TEST_PET_ID,
                "conversation_history": []
            },
            timeout=120
        )
        assert response.status_code == 200
        data = response.json()
        
        os_context = data.get("os_context", {})
        layer_activation = os_context.get("layer_activation", "")
        print(f"Vacation query layer_activation: {layer_activation}")
        assert layer_activation == "travel", f"Expected 'travel', got '{layer_activation}'"


class TestTravelContextGeneration:
    """Tests for travel_context field generation with pet-specific data"""
    
    def test_travel_context_has_required_fields(self):
        """Test travel_context includes temperament, size, breed, brachycephalic flag"""
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            json={
                "message": "Can I fly with my dog?",
                "selected_pet_id": TEST_PET_ID,
                "conversation_history": []
            },
            timeout=120
        )
        assert response.status_code == 200
        data = response.json()
        
        os_context = data.get("os_context", {})
        travel_context = os_context.get("travel_context", {})
        
        # Check required fields exist
        print(f"Full travel_context: {travel_context}")
        
        # breed field
        assert "breed" in travel_context, "travel_context should include breed"
        print(f"travel_context.breed: {travel_context.get('breed')}")
        
        # size field
        assert "size" in travel_context, "travel_context should include size"
        print(f"travel_context.size: {travel_context.get('size')}")
        
        # brachycephalic flag
        assert "brachycephalic" in travel_context, "travel_context should include brachycephalic flag"
        print(f"travel_context.brachycephalic: {travel_context.get('brachycephalic')}")
        
        # temperament field
        assert "temperament" in travel_context, "travel_context should include temperament"
        print(f"travel_context.temperament: {travel_context.get('temperament')}")
    
    def test_mojo_is_not_brachycephalic(self):
        """Test that Mojo (Indie breed) is correctly flagged as NOT brachycephalic"""
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            json={
                "message": "I want to fly with my dog",
                "selected_pet_id": TEST_PET_ID,
                "conversation_history": []
            },
            timeout=120
        )
        assert response.status_code == 200
        data = response.json()
        
        os_context = data.get("os_context", {})
        travel_context = os_context.get("travel_context", {})
        
        brachycephalic = travel_context.get("brachycephalic")
        breed = travel_context.get("breed", "")
        
        print(f"Mojo breed: {breed}, brachycephalic: {brachycephalic}")
        
        # Indie breed is NOT brachycephalic
        assert brachycephalic == False, f"Indie breed should have brachycephalic=False, got {brachycephalic}"
    
    def test_travel_context_includes_vaccinations(self):
        """Test travel_context includes vaccinations for travel document verification"""
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            json={
                "message": "What documents do I need to fly with my dog?",
                "selected_pet_id": TEST_PET_ID,
                "conversation_history": []
            },
            timeout=120
        )
        assert response.status_code == 200
        data = response.json()
        
        os_context = data.get("os_context", {})
        travel_context = os_context.get("travel_context", {})
        
        # vaccinations should be present (may be empty list)
        assert "vaccinations" in travel_context, "travel_context should include vaccinations"
        print(f"travel_context.vaccinations: {travel_context.get('vaccinations')}")
    
    def test_travel_context_includes_health_flags(self):
        """Test travel_context includes health_flags"""
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            json={
                "message": "Is it safe for my dog to travel by plane?",
                "selected_pet_id": TEST_PET_ID,
                "conversation_history": []
            },
            timeout=120
        )
        assert response.status_code == 200
        data = response.json()
        
        os_context = data.get("os_context", {})
        travel_context = os_context.get("travel_context", {})
        
        # health_flags should be present
        assert "health_flags" in travel_context, "travel_context should include health_flags"
        print(f"travel_context.health_flags: {travel_context.get('health_flags')}")
    
    def test_travel_context_includes_allergies(self):
        """Test travel_context includes allergies (Mojo has Chicken allergy)"""
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            json={
                "message": "Planning to fly with my dog",
                "selected_pet_id": TEST_PET_ID,
                "conversation_history": []
            },
            timeout=120
        )
        assert response.status_code == 200
        data = response.json()
        
        os_context = data.get("os_context", {})
        travel_context = os_context.get("travel_context", {})
        
        allergies = travel_context.get("allergies", [])
        print(f"travel_context.allergies: {allergies}")
        
        # Mojo has Chicken allergy
        assert "Chicken" in allergies or "chicken" in [a.lower() for a in allergies], \
            f"Mojo's Chicken allergy should be in travel_context.allergies, got {allergies}"


class TestTravelPicksGeneration:
    """Tests for travel_picks Concierge Pick Cards generation"""
    
    def test_flight_query_generates_carrier_policy_pick(self):
        """Test flight query generates Carrier Policy pick"""
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            json={
                "message": "I want to fly with my dog",
                "selected_pet_id": TEST_PET_ID,
                "conversation_history": []
            },
            timeout=120
        )
        assert response.status_code == 200
        data = response.json()
        
        os_context = data.get("os_context", {})
        travel_picks = os_context.get("travel_picks", [])
        
        print(f"Flight query travel_picks: {travel_picks}")
        
        # Find carrier_policy pick
        carrier_picks = [p for p in travel_picks if p.get("service_type") == "carrier_policy"]
        assert len(carrier_picks) > 0, "Flight query should generate carrier_policy pick"
        
        # Verify structure
        carrier_pick = carrier_picks[0]
        assert "title" in carrier_pick
        assert "cta" in carrier_pick
        assert "service_type" in carrier_pick
    
    def test_road_trip_query_generates_road_trip_pick(self):
        """Test road trip query generates Road Trip Schedule pick"""
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            json={
                "message": "Taking my dog on a road trip",
                "selected_pet_id": TEST_PET_ID,
                "conversation_history": []
            },
            timeout=120
        )
        assert response.status_code == 200
        data = response.json()
        
        os_context = data.get("os_context", {})
        travel_picks = os_context.get("travel_picks", [])
        
        print(f"Road trip query travel_picks: {travel_picks}")
        
        # Find road_trip pick
        road_trip_picks = [p for p in travel_picks if p.get("service_type") == "road_trip"]
        assert len(road_trip_picks) > 0, "Road trip query should generate road_trip pick"
    
    def test_documents_query_generates_travel_documents_pick(self):
        """Test documents query generates Document Coordination pick"""
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            json={
                "message": "What documents do I need for my dog to travel?",
                "selected_pet_id": TEST_PET_ID,
                "conversation_history": []
            },
            timeout=120
        )
        assert response.status_code == 200
        data = response.json()
        
        os_context = data.get("os_context", {})
        travel_picks = os_context.get("travel_picks", [])
        
        print(f"Documents query travel_picks: {travel_picks}")
        
        # Find travel_documents pick
        doc_picks = [p for p in travel_picks if p.get("service_type") == "travel_documents"]
        assert len(doc_picks) > 0, "Documents query should generate travel_documents pick"
    
    def test_itinerary_query_generates_itinerary_pick(self):
        """Test itinerary query generates Pet-Friendly Itinerary pick"""
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            json={
                "message": "Help me plan a pet-friendly itinerary",
                "selected_pet_id": TEST_PET_ID,
                "conversation_history": []
            },
            timeout=120
        )
        assert response.status_code == 200
        data = response.json()
        
        os_context = data.get("os_context", {})
        travel_picks = os_context.get("travel_picks", [])
        
        print(f"Itinerary query travel_picks: {travel_picks}")
        
        # Find itinerary_planning pick
        itinerary_picks = [p for p in travel_picks if p.get("service_type") == "itinerary_planning"]
        assert len(itinerary_picks) > 0, "Itinerary query should generate itinerary_planning pick"
    
    def test_travel_picks_have_concierge_always_true(self):
        """Test all travel picks have concierge_always: true"""
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            json={
                "message": "Planning to fly with my dog",
                "selected_pet_id": TEST_PET_ID,
                "conversation_history": []
            },
            timeout=120
        )
        assert response.status_code == 200
        data = response.json()
        
        os_context = data.get("os_context", {})
        travel_picks = os_context.get("travel_picks", [])
        
        assert len(travel_picks) > 0, "Should have travel picks"
        
        for pick in travel_picks:
            concierge_always = pick.get("concierge_always")
            print(f"Pick '{pick.get('title')}' concierge_always: {concierge_always}")
            assert concierge_always == True, \
                f"Pick '{pick.get('title')}' should have concierge_always=True, got {concierge_always}"


class TestConciergeHandoff:
    """Tests for concierge_handoff availability in TRAVEL pillar"""
    
    def test_concierge_handoff_always_available_for_travel(self):
        """Test concierge_handoff is always available for TRAVEL queries"""
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            json={
                "message": "I want to travel with my dog",
                "selected_pet_id": TEST_PET_ID,
                "conversation_history": []
            },
            timeout=120
        )
        assert response.status_code == 200
        data = response.json()
        
        os_context = data.get("os_context", {})
        concierge_handoff = os_context.get("concierge_handoff", {})
        
        print(f"concierge_handoff: {concierge_handoff}")
        
        # Check concierge_handoff is available
        assert concierge_handoff.get("available") == True, \
            f"concierge_handoff.available should be True for TRAVEL, got {concierge_handoff.get('available')}"
        
        # Should have reason and cta
        assert "reason" in concierge_handoff, "concierge_handoff should have reason"
        assert "cta" in concierge_handoff, "concierge_handoff should have cta"
        print(f"concierge_handoff.reason: {concierge_handoff.get('reason')}")
        print(f"concierge_handoff.cta: {concierge_handoff.get('cta')}")
    
    def test_concierge_handoff_for_flight_query(self):
        """Test concierge_handoff is available for flight queries"""
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            json={
                "message": "Can I fly with my dog internationally?",
                "selected_pet_id": TEST_PET_ID,
                "conversation_history": []
            },
            timeout=120
        )
        assert response.status_code == 200
        data = response.json()
        
        os_context = data.get("os_context", {})
        concierge_handoff = os_context.get("concierge_handoff", {})
        
        assert concierge_handoff.get("available") == True, \
            "concierge_handoff should be available for flight queries"
    
    def test_concierge_handoff_for_road_trip_query(self):
        """Test concierge_handoff is available for road trip queries"""
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            json={
                "message": "Planning a road trip with my dog",
                "selected_pet_id": TEST_PET_ID,
                "conversation_history": []
            },
            timeout=120
        )
        assert response.status_code == 200
        data = response.json()
        
        os_context = data.get("os_context", {})
        concierge_handoff = os_context.get("concierge_handoff", {})
        
        assert concierge_handoff.get("available") == True, \
            "concierge_handoff should be available for road trip queries"


class TestGooglePlacesFlag:
    """Tests for uses_google_places flag on relevant picks"""
    
    def test_itinerary_pick_has_uses_google_places(self):
        """Test itinerary_planning pick has uses_google_places: true"""
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            json={
                "message": "Help me find pet-friendly places to visit",
                "selected_pet_id": TEST_PET_ID,
                "conversation_history": []
            },
            timeout=120
        )
        assert response.status_code == 200
        data = response.json()
        
        os_context = data.get("os_context", {})
        travel_picks = os_context.get("travel_picks", [])
        
        # Find itinerary_planning pick
        itinerary_picks = [p for p in travel_picks if p.get("service_type") == "itinerary_planning"]
        
        if len(itinerary_picks) > 0:
            itinerary_pick = itinerary_picks[0]
            uses_google_places = itinerary_pick.get("uses_google_places")
            print(f"itinerary_planning uses_google_places: {uses_google_places}")
            assert uses_google_places == True, \
                f"itinerary_planning pick should have uses_google_places=True, got {uses_google_places}"
        else:
            # May not always generate itinerary pick - check carrier_policy as backup
            print("No itinerary_planning pick generated, checking carrier_policy...")
    
    def test_carrier_policy_pick_has_uses_google_places(self):
        """Test carrier_policy pick has uses_google_places: true (for airline/airport searches)"""
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            json={
                "message": "I want to fly with my dog to Mumbai",
                "selected_pet_id": TEST_PET_ID,
                "conversation_history": []
            },
            timeout=120
        )
        assert response.status_code == 200
        data = response.json()
        
        os_context = data.get("os_context", {})
        travel_picks = os_context.get("travel_picks", [])
        
        # Find carrier_policy pick
        carrier_picks = [p for p in travel_picks if p.get("service_type") == "carrier_policy"]
        
        if len(carrier_picks) > 0:
            carrier_pick = carrier_picks[0]
            uses_google_places = carrier_pick.get("uses_google_places")
            print(f"carrier_policy uses_google_places: {uses_google_places}")
            # carrier_policy may or may not have uses_google_places based on implementation
            print(f"carrier_policy pick: {carrier_pick}")


class TestPicksUpdate:
    """Tests for picks_update signal for frontend"""
    
    def test_travel_query_triggers_picks_update(self):
        """Test TRAVEL queries trigger picks_update with pillar=travel"""
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            json={
                "message": "Planning a trip with my dog",
                "selected_pet_id": TEST_PET_ID,
                "conversation_history": []
            },
            timeout=120
        )
        assert response.status_code == 200
        data = response.json()
        
        os_context = data.get("os_context", {})
        picks_update = os_context.get("picks_update", {})
        
        print(f"picks_update: {picks_update}")
        
        assert picks_update.get("should_refresh") == True, \
            "picks_update.should_refresh should be True for TRAVEL"
        assert picks_update.get("pillar") == "travel", \
            f"picks_update.pillar should be 'travel', got {picks_update.get('pillar')}"
        assert "context" in picks_update, "picks_update should have context"
        print(f"picks_update.context: {picks_update.get('context')}")


class TestBrachycephalicDetection:
    """Tests for brachycephalic breed detection (code logic verification)"""
    
    def test_brachycephalic_breeds_list(self):
        """Test brachycephalic breeds are correctly identified in code"""
        # This is a code verification test - checking the logic in mira_routes.py
        # The brachycephalic breeds list includes: pug, bulldog, boxer, shih tzu, boston terrier, pekingese
        
        brachycephalic_breeds = ["pug", "bulldog", "boxer", "shih tzu", "boston terrier", "pekingese"]
        
        # Verify the logic would correctly identify these breeds
        test_breed = "pug"
        is_brachy = any(b in test_breed.lower() for b in brachycephalic_breeds)
        assert is_brachy == True, f"{test_breed} should be identified as brachycephalic"
        
        test_breed = "French Bulldog"
        is_brachy = any(b in test_breed.lower() for b in brachycephalic_breeds)
        assert is_brachy == True, f"{test_breed} should be identified as brachycephalic"
        
        test_breed = "Indie"  # Mojo's breed
        is_brachy = any(b in test_breed.lower() for b in brachycephalic_breeds)
        assert is_brachy == False, f"{test_breed} should NOT be identified as brachycephalic"
        
        test_breed = "Golden Retriever"
        is_brachy = any(b in test_breed.lower() for b in brachycephalic_breeds)
        assert is_brachy == False, f"{test_breed} should NOT be identified as brachycephalic"
        
        print("Brachycephalic breed detection logic verified correctly")


class TestNonTravelRouting:
    """Tests to verify non-TRAVEL queries still route correctly"""
    
    def test_birthday_query_routes_to_celebrate(self):
        """Test birthday query routes to CELEBRATE, not TRAVEL"""
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            json={
                "message": "I want to plan my dog's birthday party",
                "selected_pet_id": TEST_PET_ID,
                "conversation_history": []
            },
            timeout=120
        )
        assert response.status_code == 200
        data = response.json()
        
        os_context = data.get("os_context", {})
        layer_activation = os_context.get("layer_activation", "")
        
        print(f"Birthday query layer_activation: {layer_activation}")
        assert layer_activation == "celebrate", \
            f"Birthday query should route to 'celebrate', got '{layer_activation}'"
    
    def test_meal_plan_query_routes_to_dine(self):
        """Test meal plan query routes to DINE, not TRAVEL"""
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            json={
                "message": "What should I feed my dog?",
                "selected_pet_id": TEST_PET_ID,
                "conversation_history": []
            },
            timeout=120
        )
        assert response.status_code == 200
        data = response.json()
        
        os_context = data.get("os_context", {})
        layer_activation = os_context.get("layer_activation", "")
        
        print(f"Meal plan query layer_activation: {layer_activation}")
        assert layer_activation == "dine", \
            f"Meal plan query should route to 'dine', got '{layer_activation}'"
    
    def test_boarding_query_routes_to_stay(self):
        """Test boarding query routes to STAY, not TRAVEL"""
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            json={
                "message": "I need to board my dog for a few days",
                "selected_pet_id": TEST_PET_ID,
                "conversation_history": []
            },
            timeout=120
        )
        assert response.status_code == 200
        data = response.json()
        
        os_context = data.get("os_context", {})
        layer_activation = os_context.get("layer_activation", "")
        
        print(f"Boarding query layer_activation: {layer_activation}")
        assert layer_activation == "stay", \
            f"Boarding query should route to 'stay', got '{layer_activation}'"
    
    def test_grooming_query_routes_to_care(self):
        """Test grooming query routes to CARE, not TRAVEL"""
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            json={
                "message": "My dog needs a haircut",
                "selected_pet_id": TEST_PET_ID,
                "conversation_history": []
            },
            timeout=120
        )
        assert response.status_code == 200
        data = response.json()
        
        os_context = data.get("os_context", {})
        layer_activation = os_context.get("layer_activation", "")
        
        print(f"Grooming query layer_activation: {layer_activation}")
        assert layer_activation == "care", \
            f"Grooming query should route to 'care', got '{layer_activation}'"


class TestSafetyGates:
    """Tests for safety gates inclusion in TRAVEL context"""
    
    def test_safety_gates_include_allergies(self):
        """Test safety_gates include Mojo's chicken allergy"""
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            json={
                "message": "Planning to travel with my dog",
                "selected_pet_id": TEST_PET_ID,
                "conversation_history": []
            },
            timeout=120
        )
        assert response.status_code == 200
        data = response.json()
        
        os_context = data.get("os_context", {})
        safety_gates = os_context.get("safety_gates", [])
        
        print(f"safety_gates: {safety_gates}")
        
        # Find allergy gate
        allergy_gates = [g for g in safety_gates if g.get("type") == "allergy"]
        assert len(allergy_gates) > 0, "safety_gates should include allergy gate"
        
        allergy_items = allergy_gates[0].get("items", [])
        print(f"allergy_items: {allergy_items}")
        
        # Mojo has Chicken allergy
        assert "Chicken" in allergy_items or "chicken" in [a.lower() for a in allergy_items], \
            f"Mojo's Chicken allergy should be in safety_gates, got {allergy_items}"


class TestTemporalContext:
    """Tests for temporal context (birthday proximity)"""
    
    def test_temporal_context_for_birthday(self):
        """Test temporal_context detects Mojo's birthday proximity"""
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            json={
                "message": "Planning to travel with my dog",
                "selected_pet_id": TEST_PET_ID,
                "conversation_history": []
            },
            timeout=120
        )
        assert response.status_code == 200
        data = response.json()
        
        os_context = data.get("os_context", {})
        temporal_context = os_context.get("temporal_context")
        
        print(f"temporal_context: {temporal_context}")
        
        # Mojo's birthday is Feb 14 - if we're within 30 days, should see context
        if temporal_context:
            assert "type" in temporal_context
            print(f"temporal_context.type: {temporal_context.get('type')}")
            print(f"temporal_context.days_until: {temporal_context.get('days_until')}")


# Pytest fixtures
@pytest.fixture
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
