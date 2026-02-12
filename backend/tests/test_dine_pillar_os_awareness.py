"""
Test DINE Pillar OS-Awareness for MIRA AI Pet Companion

Tests the following per MIRA BIBLE specification:
1. DINE pillar detection for nutrition queries (meal plan, kibble, wet food, how much to feed)
2. os_context.dine_context generation with pet's allergies and diet info
3. os_context.dine_picks generation with Concierge Pick Cards
4. os_context.safety_gates including allergies
5. os_context.temporal_context for birthday detection
6. Non-DINE queries still route correctly (celebrate for birthday, care for grooming)
"""

import pytest
import requests
import os
import json

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
TEST_PET_ID = "pet-99a708f1722a"  # Mojo - chicken allergy, birthday Feb 14


class TestDinePillarDetection:
    """Test DINE pillar detection for nutrition queries"""
    
    def test_meal_plan_query_detects_dine_pillar(self):
        """Test that 'meal plan' query routes to DINE pillar"""
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            json={
                "input": "Create a meal plan for my dog",
                "pet_id": TEST_PET_ID,
                "session_id": "test-dine-meal-plan"
            }
        )
        assert response.status_code == 200, f"API returned {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify pillar is 'dine'
        assert data.get("pillar") == "dine", f"Expected pillar='dine', got pillar='{data.get('pillar')}'"
        
        # Verify os_context has layer_activation='dine'
        os_context = data.get("os_context", {})
        assert os_context.get("layer_activation") == "dine", f"Expected layer_activation='dine', got '{os_context.get('layer_activation')}'"
        
        print(f"SUCCESS: 'meal plan' query correctly routed to DINE pillar")

    def test_kibble_or_wet_food_query_detects_dine_pillar(self):
        """Test that 'kibble or wet food' query routes to DINE pillar"""
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            json={
                "input": "Should I feed my dog kibble or wet food?",
                "pet_id": TEST_PET_ID,
                "session_id": "test-dine-kibble"
            }
        )
        assert response.status_code == 200, f"API returned {response.status_code}: {response.text}"
        data = response.json()
        
        assert data.get("pillar") == "dine", f"Expected pillar='dine', got pillar='{data.get('pillar')}'"
        print(f"SUCCESS: 'kibble or wet food' query correctly routed to DINE pillar")

    def test_how_much_to_feed_query_detects_dine_pillar(self):
        """Test that 'how much to feed' query routes to DINE pillar"""
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            json={
                "input": "How much should I feed my dog daily?",
                "pet_id": TEST_PET_ID,
                "session_id": "test-dine-portions"
            }
        )
        assert response.status_code == 200, f"API returned {response.status_code}: {response.text}"
        data = response.json()
        
        assert data.get("pillar") == "dine", f"Expected pillar='dine', got pillar='{data.get('pillar')}'"
        
        # Check for dine_picks with portioning setup
        os_context = data.get("os_context", {})
        dine_picks = os_context.get("dine_picks", [])
        
        # Should include portioning setup pick
        has_portioning_pick = any(pick.get("service_type") == "portioning_setup" for pick in dine_picks)
        assert has_portioning_pick, f"Expected portioning_setup pick, got dine_picks={dine_picks}"
        
        print(f"SUCCESS: 'how much to feed' query correctly routed to DINE pillar with portioning pick")

    def test_nutrition_query_stays_in_dine_pillar(self):
        """Test that nutrition queries stay in DINE pillar (not switched to FIT)"""
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            json={
                "input": "What nutrition plan would work best for my dog?",
                "pet_id": TEST_PET_ID,
                "session_id": "test-dine-nutrition"
            }
        )
        assert response.status_code == 200, f"API returned {response.status_code}: {response.text}"
        data = response.json()
        
        # Must stay in 'dine' (not 'fit')
        assert data.get("pillar") == "dine", f"Expected pillar='dine' (not 'fit'), got pillar='{data.get('pillar')}'"
        print(f"SUCCESS: Nutrition query stays in DINE pillar (not FIT)")

    def test_diet_transition_query_detects_dine_pillar(self):
        """Test that diet transition queries route to DINE pillar with transition pick"""
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            json={
                "input": "I want to switch my dog to a new food brand",
                "pet_id": TEST_PET_ID,
                "session_id": "test-dine-transition"
            }
        )
        assert response.status_code == 200, f"API returned {response.status_code}: {response.text}"
        data = response.json()
        
        assert data.get("pillar") == "dine", f"Expected pillar='dine', got pillar='{data.get('pillar')}'"
        
        # Check for diet transition pick
        os_context = data.get("os_context", {})
        dine_picks = os_context.get("dine_picks", [])
        
        has_transition_pick = any(pick.get("service_type") == "diet_transition" for pick in dine_picks)
        assert has_transition_pick, f"Expected diet_transition pick, got dine_picks={dine_picks}"
        
        print(f"SUCCESS: Diet transition query routes to DINE with transition pick")


class TestDineContextGeneration:
    """Test os_context.dine_context generation with pet's allergies and diet info"""
    
    def test_dine_context_includes_allergies(self):
        """Test that dine_context includes pet's allergies"""
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            json={
                "input": "What food is best for my dog?",
                "pet_id": TEST_PET_ID,
                "session_id": "test-dine-allergies"
            }
        )
        assert response.status_code == 200, f"API returned {response.status_code}: {response.text}"
        data = response.json()
        
        os_context = data.get("os_context", {})
        dine_context = os_context.get("dine_context", {})
        
        # Mojo has chicken allergy
        allergies = dine_context.get("allergies", [])
        assert len(allergies) > 0, f"Expected allergies in dine_context, got {dine_context}"
        
        # Check if chicken is in allergies (case-insensitive)
        allergy_lower = [a.lower() if isinstance(a, str) else str(a).lower() for a in allergies]
        assert any("chicken" in a for a in allergy_lower), f"Expected 'chicken' in allergies, got {allergies}"
        
        print(f"SUCCESS: dine_context includes pet's chicken allergy: {allergies}")

    def test_dine_context_structure(self):
        """Test that dine_context has correct structure"""
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            json={
                "input": "Create an everyday meal routine for my dog",
                "pet_id": TEST_PET_ID,
                "session_id": "test-dine-structure"
            }
        )
        assert response.status_code == 200, f"API returned {response.status_code}: {response.text}"
        data = response.json()
        
        os_context = data.get("os_context", {})
        dine_context = os_context.get("dine_context")
        
        # dine_context should exist for DINE queries
        assert dine_context is not None, f"Expected dine_context in os_context, got {os_context.keys()}"
        
        # Check expected fields
        expected_fields = ["current_diet", "allergies", "diet_restrictions"]
        for field in expected_fields:
            assert field in dine_context, f"Expected '{field}' in dine_context, got {dine_context.keys()}"
        
        print(f"SUCCESS: dine_context has correct structure: {list(dine_context.keys())}")


class TestDinePicks:
    """Test os_context.dine_picks generation with Concierge Pick Cards"""
    
    def test_dine_picks_generated_for_meal_query(self):
        """Test that dine_picks are generated for meal queries"""
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            json={
                "input": "Help me plan my dog's daily meals",
                "pet_id": TEST_PET_ID,
                "session_id": "test-dine-picks"
            }
        )
        assert response.status_code == 200, f"API returned {response.status_code}: {response.text}"
        data = response.json()
        
        os_context = data.get("os_context", {})
        dine_picks = os_context.get("dine_picks", [])
        
        # Should have at least one pick
        assert len(dine_picks) > 0, f"Expected dine_picks, got empty list"
        
        # Each pick should have required fields
        for pick in dine_picks:
            assert "title" in pick, f"Pick missing 'title': {pick}"
            assert "cta" in pick, f"Pick missing 'cta': {pick}"
            assert "service_type" in pick, f"Pick missing 'service_type': {pick}"
        
        print(f"SUCCESS: dine_picks generated with {len(dine_picks)} picks")
        for pick in dine_picks:
            print(f"  - {pick.get('title')} [{pick.get('cta')}] -> {pick.get('service_type')}")

    def test_treat_query_includes_treat_strategy_pick(self):
        """Test that treat queries include treat strategy pick"""
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            json={
                "input": "How should I manage treats for training?",
                "pet_id": TEST_PET_ID,
                "session_id": "test-dine-treats"
            }
        )
        assert response.status_code == 200, f"API returned {response.status_code}: {response.text}"
        data = response.json()
        
        os_context = data.get("os_context", {})
        dine_picks = os_context.get("dine_picks", [])
        
        has_treat_pick = any(pick.get("service_type") == "treat_strategy" for pick in dine_picks)
        assert has_treat_pick, f"Expected treat_strategy pick for treat query, got {dine_picks}"
        
        print(f"SUCCESS: Treat query includes treat_strategy pick")

    def test_allergy_includes_nutrition_consult_pick(self):
        """Test that pets with allergies get nutrition consult pick"""
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            json={
                "input": "What food options work for my dog with allergies?",
                "pet_id": TEST_PET_ID,  # Mojo has chicken allergy
                "session_id": "test-dine-allergy-consult"
            }
        )
        assert response.status_code == 200, f"API returned {response.status_code}: {response.text}"
        data = response.json()
        
        os_context = data.get("os_context", {})
        dine_picks = os_context.get("dine_picks", [])
        
        has_consult_pick = any(pick.get("service_type") == "nutrition_consult" for pick in dine_picks)
        assert has_consult_pick, f"Expected nutrition_consult pick for pet with allergies, got {dine_picks}"
        
        print(f"SUCCESS: Pet with allergies gets nutrition_consult pick")


class TestSafetyGates:
    """Test os_context.safety_gates including allergies"""
    
    def test_safety_gates_include_allergies(self):
        """Test that safety_gates include pet's allergies"""
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            json={
                "input": "What should I feed my dog?",
                "pet_id": TEST_PET_ID,
                "session_id": "test-safety-gates"
            }
        )
        assert response.status_code == 200, f"API returned {response.status_code}: {response.text}"
        data = response.json()
        
        os_context = data.get("os_context", {})
        safety_gates = os_context.get("safety_gates", [])
        
        # Should have at least one safety gate for allergies
        assert len(safety_gates) > 0, f"Expected safety_gates, got empty list"
        
        # Find allergy gate
        allergy_gates = [g for g in safety_gates if g.get("type") == "allergy"]
        assert len(allergy_gates) > 0, f"Expected allergy gate in safety_gates, got {safety_gates}"
        
        # Check allergy items
        allergy_items = allergy_gates[0].get("items", [])
        assert len(allergy_items) > 0, f"Expected allergy items, got empty"
        
        # Verify chicken allergy
        allergy_lower = [item.lower() if isinstance(item, str) else str(item).lower() for item in allergy_items]
        assert any("chicken" in a for a in allergy_lower), f"Expected 'Chicken' in allergy items, got {allergy_items}"
        
        print(f"SUCCESS: safety_gates include chicken allergy: {safety_gates}")


class TestTemporalContext:
    """Test os_context.temporal_context for birthday detection"""
    
    def test_temporal_context_detects_birthday(self):
        """Test that temporal_context detects upcoming birthday"""
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            json={
                "input": "Tell me about my dog",
                "pet_id": TEST_PET_ID,  # Mojo birthday Feb 14
                "session_id": "test-temporal-birthday"
            }
        )
        assert response.status_code == 200, f"API returned {response.status_code}: {response.text}"
        data = response.json()
        
        os_context = data.get("os_context", {})
        temporal_context = os_context.get("temporal_context")
        
        # Mojo's birthday is Feb 14 - should be detected if within 30 days
        if temporal_context:
            assert temporal_context.get("type") == "birthday_upcoming", f"Expected birthday_upcoming, got {temporal_context.get('type')}"
            assert "days_until" in temporal_context, f"Expected days_until in temporal_context"
            assert "date" in temporal_context, f"Expected date in temporal_context"
            print(f"SUCCESS: Birthday detected - {temporal_context.get('message')}")
        else:
            print(f"INFO: Birthday not within 30 days range (expected if current date is far from Feb 14)")


class TestNonDineQueriesRouteCorrectly:
    """Test that non-DINE queries still route correctly"""
    
    def test_birthday_query_routes_to_celebrate(self):
        """Test that birthday queries route to CELEBRATE pillar"""
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            json={
                "input": "I want to plan a birthday party for my dog",
                "pet_id": TEST_PET_ID,
                "session_id": "test-celebrate-birthday"
            }
        )
        assert response.status_code == 200, f"API returned {response.status_code}: {response.text}"
        data = response.json()
        
        assert data.get("pillar") == "celebrate", f"Expected pillar='celebrate', got pillar='{data.get('pillar')}'"
        print(f"SUCCESS: Birthday party query routes to CELEBRATE pillar")

    def test_grooming_query_routes_to_care(self):
        """Test that grooming queries route to CARE pillar"""
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            json={
                "input": "My dog needs grooming and a haircut",
                "pet_id": TEST_PET_ID,
                "session_id": "test-care-grooming"
            }
        )
        assert response.status_code == 200, f"API returned {response.status_code}: {response.text}"
        data = response.json()
        
        assert data.get("pillar") == "care", f"Expected pillar='care', got pillar='{data.get('pillar')}'"
        print(f"SUCCESS: Grooming query routes to CARE pillar")

    def test_travel_query_routes_to_travel(self):
        """Test that travel queries route to TRAVEL pillar"""
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            json={
                "input": "I'm planning a road trip with my dog",
                "pet_id": TEST_PET_ID,
                "session_id": "test-travel"
            }
        )
        assert response.status_code == 200, f"API returned {response.status_code}: {response.text}"
        data = response.json()
        
        assert data.get("pillar") == "travel", f"Expected pillar='travel', got pillar='{data.get('pillar')}'"
        print(f"SUCCESS: Travel query routes to TRAVEL pillar")

    def test_fitness_query_routes_to_fit(self):
        """Test that fitness/weight queries route to FIT pillar"""
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            json={
                "input": "My dog needs more exercise and is overweight",
                "pet_id": TEST_PET_ID,
                "session_id": "test-fit-exercise"
            }
        )
        assert response.status_code == 200, f"API returned {response.status_code}: {response.text}"
        data = response.json()
        
        # FIT pillar for weight/fitness concerns
        assert data.get("pillar") == "fit", f"Expected pillar='fit', got pillar='{data.get('pillar')}'"
        print(f"SUCCESS: Fitness/weight query routes to FIT pillar")


class TestDineVsFitPillarSeparation:
    """Test that nutrition stays in DINE and fitness stays in FIT"""
    
    def test_food_query_routes_to_dine_not_fit(self):
        """Test that food/diet queries route to DINE, not FIT"""
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            json={
                "input": "What's the best diet for my dog?",
                "pet_id": TEST_PET_ID,
                "session_id": "test-dine-vs-fit-food"
            }
        )
        assert response.status_code == 200, f"API returned {response.status_code}: {response.text}"
        data = response.json()
        
        assert data.get("pillar") == "dine", f"Food/diet query should route to 'dine', not '{data.get('pillar')}'"
        print(f"SUCCESS: Food/diet query routes to DINE (not FIT)")

    def test_weight_loss_exercise_routes_to_fit(self):
        """Test that weight loss + exercise queries route to FIT"""
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            json={
                "input": "My dog is obese and needs a workout routine",
                "pet_id": TEST_PET_ID,
                "session_id": "test-fit-weight-loss"
            }
        )
        assert response.status_code == 200, f"API returned {response.status_code}: {response.text}"
        data = response.json()
        
        assert data.get("pillar") == "fit", f"Weight/exercise query should route to 'fit', got '{data.get('pillar')}'"
        print(f"SUCCESS: Weight/exercise query routes to FIT (not DINE)")


class TestPicksUpdate:
    """Test os_context.picks_update for DINE pillar"""
    
    def test_picks_update_triggers_for_dine_pillar(self):
        """Test that picks_update signals refresh for DINE pillar"""
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            json={
                "input": "Help me with my dog's feeding schedule",
                "pet_id": TEST_PET_ID,
                "session_id": "test-picks-update"
            }
        )
        assert response.status_code == 200, f"API returned {response.status_code}: {response.text}"
        data = response.json()
        
        os_context = data.get("os_context", {})
        picks_update = os_context.get("picks_update", {})
        
        assert picks_update.get("should_refresh") == True, f"Expected should_refresh=True, got {picks_update}"
        assert picks_update.get("pillar") == "dine", f"Expected pillar='dine', got {picks_update.get('pillar')}"
        
        print(f"SUCCESS: picks_update triggers refresh for DINE pillar: {picks_update}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
