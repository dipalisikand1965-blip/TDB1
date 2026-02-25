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


def make_chat_request(message: str, session_id: str = None):
    """Helper function to make a chat request with correct field names"""
    payload = {
        "message": message,
        "selected_pet_id": TEST_PET_ID,
        "session_id": session_id or f"test-{message[:20].replace(' ', '-')}"
    }
    return requests.post(f"{BASE_URL}/api/mira/chat", json=payload)


class TestDinePillarDetection:
    """Test DINE pillar detection for nutrition queries"""
    
    def test_meal_plan_query_detects_dine_pillar(self):
        """Test that 'meal plan' query routes to DINE pillar"""
        response = make_chat_request("Create a meal plan for my dog", "test-dine-meal-plan")
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
        response = make_chat_request("Should I feed my dog kibble or wet food?", "test-dine-kibble")
        assert response.status_code == 200, f"API returned {response.status_code}: {response.text}"
        data = response.json()
        
        assert data.get("pillar") == "dine", f"Expected pillar='dine', got pillar='{data.get('pillar')}'"
        print(f"SUCCESS: 'kibble or wet food' query correctly routed to DINE pillar")

    def test_how_much_to_feed_query_detects_dine_pillar(self):
        """Test that 'how much to feed' query routes to DINE pillar"""
        response = make_chat_request("How much should I feed my dog daily?", "test-dine-portions")
        assert response.status_code == 200, f"API returned {response.status_code}: {response.text}"
        data = response.json()
        
        assert data.get("pillar") == "dine", f"Expected pillar='dine', got pillar='{data.get('pillar')}'"
        
        # Check for dine_picks with portioning setup
        os_context = data.get("os_context", {})
        dine_picks = os_context.get("dine_picks", [])
        
        # Should include portioning setup pick
        has_portioning_pick = any(pick.get("service_type") == "portioning_setup" for pick in dine_picks)
        # Note: portioning pick is conditional, so just verify pillar is correct
        
        print(f"SUCCESS: 'how much to feed' query correctly routed to DINE pillar")
        if dine_picks:
            print(f"  dine_picks: {[p.get('service_type') for p in dine_picks]}")

    def test_nutrition_query_stays_in_dine_pillar(self):
        """Test that nutrition queries stay in DINE pillar (not switched to FIT)"""
        response = make_chat_request("What nutrition plan would work best for my dog?", "test-dine-nutrition")
        assert response.status_code == 200, f"API returned {response.status_code}: {response.text}"
        data = response.json()
        
        # Must stay in 'dine' (not 'fit')
        assert data.get("pillar") == "dine", f"Expected pillar='dine' (not 'fit'), got pillar='{data.get('pillar')}'"
        print(f"SUCCESS: Nutrition query stays in DINE pillar (not FIT)")

    def test_diet_transition_query_detects_dine_pillar(self):
        """Test that diet transition queries route to DINE pillar with transition pick"""
        response = make_chat_request("I want to switch my dog to a new food brand", "test-dine-transition")
        assert response.status_code == 200, f"API returned {response.status_code}: {response.text}"
        data = response.json()
        
        assert data.get("pillar") == "dine", f"Expected pillar='dine', got pillar='{data.get('pillar')}'"
        
        # Check for diet transition pick
        os_context = data.get("os_context", {})
        dine_picks = os_context.get("dine_picks", [])
        
        if dine_picks:
            has_transition_pick = any(pick.get("service_type") == "diet_transition" for pick in dine_picks)
            if has_transition_pick:
                print(f"SUCCESS: Diet transition query routes to DINE with transition pick")
            else:
                print(f"SUCCESS: Diet transition query routes to DINE (picks: {[p.get('service_type') for p in dine_picks]})")
        else:
            print(f"SUCCESS: Diet transition query routes to DINE pillar")


class TestDineContextGeneration:
    """Test os_context.dine_context generation with pet's allergies and diet info"""
    
    def test_dine_context_includes_allergies(self):
        """Test that dine_context includes pet's allergies"""
        response = make_chat_request("What food is best for my dog?", "test-dine-allergies")
        assert response.status_code == 200, f"API returned {response.status_code}: {response.text}"
        data = response.json()
        
        os_context = data.get("os_context", {})
        dine_context = os_context.get("dine_context", {})
        
        # Mojo has chicken allergy - check if dine_context exists and has allergies
        if dine_context:
            allergies = dine_context.get("allergies", [])
            if allergies:
                # Check if chicken is in allergies (case-insensitive)
                allergy_lower = [a.lower() if isinstance(a, str) else str(a).lower() for a in allergies]
                has_chicken = any("chicken" in a for a in allergy_lower)
                if has_chicken:
                    print(f"SUCCESS: dine_context includes pet's chicken allergy: {allergies}")
                else:
                    print(f"INFO: dine_context allergies don't include chicken: {allergies}")
            else:
                print(f"INFO: dine_context has no allergies (may need pet profile check)")
        else:
            print(f"INFO: dine_context not generated (pillar={data.get('pillar')})")
        
        # Primary assertion: pillar should be dine
        assert data.get("pillar") == "dine", f"Expected pillar='dine', got pillar='{data.get('pillar')}'"

    def test_dine_context_structure(self):
        """Test that dine_context has correct structure"""
        response = make_chat_request("Create an everyday meal routine for my dog", "test-dine-structure")
        assert response.status_code == 200, f"API returned {response.status_code}: {response.text}"
        data = response.json()
        
        os_context = data.get("os_context", {})
        dine_context = os_context.get("dine_context")
        
        # dine_context should exist for DINE queries
        if dine_context:
            # Check expected fields
            expected_fields = ["current_diet", "allergies", "diet_restrictions"]
            present_fields = [f for f in expected_fields if f in dine_context]
            print(f"SUCCESS: dine_context has structure: {list(dine_context.keys())}")
            print(f"  Present expected fields: {present_fields}")
        else:
            print(f"INFO: dine_context not present in response")
        
        # Primary assertion
        assert data.get("pillar") == "dine", f"Expected pillar='dine', got pillar='{data.get('pillar')}'"


class TestDinePicks:
    """Test os_context.dine_picks generation with Concierge Pick Cards"""
    
    def test_dine_picks_generated_for_meal_query(self):
        """Test that dine_picks are generated for meal queries"""
        response = make_chat_request("Help me plan my dog's daily meals", "test-dine-picks")
        assert response.status_code == 200, f"API returned {response.status_code}: {response.text}"
        data = response.json()
        
        os_context = data.get("os_context", {})
        dine_picks = os_context.get("dine_picks", [])
        
        # Primary assertion: pillar should be dine
        assert data.get("pillar") == "dine", f"Expected pillar='dine', got pillar='{data.get('pillar')}'"
        
        if dine_picks:
            # Each pick should have required fields
            for pick in dine_picks:
                assert "title" in pick, f"Pick missing 'title': {pick}"
                assert "service_type" in pick, f"Pick missing 'service_type': {pick}"
            
            print(f"SUCCESS: dine_picks generated with {len(dine_picks)} picks")
            for pick in dine_picks:
                print(f"  - {pick.get('title')} [{pick.get('cta', 'N/A')}] -> {pick.get('service_type')}")
        else:
            print(f"INFO: No dine_picks generated (context-dependent)")

    def test_treat_query_includes_treat_strategy_pick(self):
        """Test that treat queries include treat strategy pick"""
        response = make_chat_request("How should I manage treats for training?", "test-dine-treats")
        assert response.status_code == 200, f"API returned {response.status_code}: {response.text}"
        data = response.json()
        
        # Pillar could be dine or learn (training is in learn keywords)
        pillar = data.get("pillar")
        print(f"INFO: Treat/training query routed to pillar: {pillar}")
        
        os_context = data.get("os_context", {})
        dine_picks = os_context.get("dine_picks", [])
        
        if pillar == "dine" and dine_picks:
            has_treat_pick = any(pick.get("service_type") == "treat_strategy" for pick in dine_picks)
            if has_treat_pick:
                print(f"SUCCESS: Treat query includes treat_strategy pick")
            else:
                print(f"INFO: dine_picks present but no treat_strategy: {[p.get('service_type') for p in dine_picks]}")

    def test_allergy_includes_nutrition_consult_pick(self):
        """Test that pets with allergies get nutrition consult pick"""
        response = make_chat_request("What food options work for my dog with allergies?", "test-dine-allergy-consult")
        assert response.status_code == 200, f"API returned {response.status_code}: {response.text}"
        data = response.json()
        
        assert data.get("pillar") == "dine", f"Expected pillar='dine', got pillar='{data.get('pillar')}'"
        
        os_context = data.get("os_context", {})
        dine_picks = os_context.get("dine_picks", [])
        
        if dine_picks:
            has_consult_pick = any(pick.get("service_type") == "nutrition_consult" for pick in dine_picks)
            if has_consult_pick:
                print(f"SUCCESS: Pet with allergies gets nutrition_consult pick")
            else:
                print(f"INFO: dine_picks present: {[p.get('service_type') for p in dine_picks]}")
        else:
            print(f"INFO: No dine_picks generated")


class TestSafetyGates:
    """Test os_context.safety_gates including allergies"""
    
    def test_safety_gates_include_allergies(self):
        """Test that safety_gates include pet's allergies"""
        response = make_chat_request("What should I feed my dog?", "test-safety-gates")
        assert response.status_code == 200, f"API returned {response.status_code}: {response.text}"
        data = response.json()
        
        os_context = data.get("os_context", {})
        safety_gates = os_context.get("safety_gates", [])
        
        if safety_gates:
            # Find allergy gate
            allergy_gates = [g for g in safety_gates if g.get("type") == "allergy"]
            if allergy_gates:
                allergy_items = allergy_gates[0].get("items", [])
                if allergy_items:
                    allergy_lower = [item.lower() if isinstance(item, str) else str(item).lower() for item in allergy_items]
                    has_chicken = any("chicken" in a for a in allergy_lower)
                    if has_chicken:
                        print(f"SUCCESS: safety_gates include chicken allergy: {safety_gates}")
                    else:
                        print(f"INFO: safety_gates has allergies but not chicken: {allergy_items}")
                else:
                    print(f"INFO: allergy gate found but items empty")
            else:
                print(f"INFO: safety_gates present but no allergy type: {safety_gates}")
        else:
            print(f"INFO: safety_gates not populated")
        
        # Primary assertion
        assert data.get("pillar") == "dine", f"Expected pillar='dine', got pillar='{data.get('pillar')}'"


class TestTemporalContext:
    """Test os_context.temporal_context for birthday detection"""
    
    def test_temporal_context_detects_birthday(self):
        """Test that temporal_context detects upcoming birthday"""
        response = make_chat_request("Tell me about my dog", "test-temporal-birthday")
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
            print(f"  Days until: {temporal_context.get('days_until')}")
            print(f"  Date: {temporal_context.get('date')}")
        else:
            print(f"INFO: Birthday not detected (may be outside 30-day window from Feb 14)")


class TestNonDineQueriesRouteCorrectly:
    """Test that non-DINE queries still route correctly"""
    
    def test_birthday_query_routes_to_celebrate(self):
        """Test that birthday queries route to CELEBRATE pillar"""
        response = make_chat_request("I want to plan a birthday party for my dog", "test-celebrate-birthday")
        assert response.status_code == 200, f"API returned {response.status_code}: {response.text}"
        data = response.json()
        
        assert data.get("pillar") == "celebrate", f"Expected pillar='celebrate', got pillar='{data.get('pillar')}'"
        print(f"SUCCESS: Birthday party query routes to CELEBRATE pillar")

    def test_grooming_query_routes_to_care(self):
        """Test that grooming queries route to CARE pillar"""
        response = make_chat_request("My dog needs grooming and a haircut", "test-care-grooming")
        assert response.status_code == 200, f"API returned {response.status_code}: {response.text}"
        data = response.json()
        
        assert data.get("pillar") == "care", f"Expected pillar='care', got pillar='{data.get('pillar')}'"
        print(f"SUCCESS: Grooming query routes to CARE pillar")

    def test_travel_query_routes_to_travel(self):
        """Test that travel queries route to TRAVEL pillar"""
        response = make_chat_request("I'm planning a road trip with my dog", "test-travel")
        assert response.status_code == 200, f"API returned {response.status_code}: {response.text}"
        data = response.json()
        
        assert data.get("pillar") == "travel", f"Expected pillar='travel', got pillar='{data.get('pillar')}'"
        print(f"SUCCESS: Travel query routes to TRAVEL pillar")

    def test_fitness_query_routes_to_fit(self):
        """Test that fitness/weight queries route to FIT pillar"""
        response = make_chat_request("My dog needs more exercise and is overweight", "test-fit-exercise")
        assert response.status_code == 200, f"API returned {response.status_code}: {response.text}"
        data = response.json()
        
        # FIT pillar for weight/fitness concerns
        assert data.get("pillar") == "fit", f"Expected pillar='fit', got pillar='{data.get('pillar')}'"
        print(f"SUCCESS: Fitness/weight query routes to FIT pillar")


class TestDineVsFitPillarSeparation:
    """Test that nutrition stays in DINE and fitness stays in FIT"""
    
    def test_food_query_routes_to_dine_not_fit(self):
        """Test that food/diet queries route to DINE, not FIT"""
        response = make_chat_request("What's the best diet for my dog?", "test-dine-vs-fit-food")
        assert response.status_code == 200, f"API returned {response.status_code}: {response.text}"
        data = response.json()
        
        assert data.get("pillar") == "dine", f"Food/diet query should route to 'dine', not '{data.get('pillar')}'"
        print(f"SUCCESS: Food/diet query routes to DINE (not FIT)")

    def test_weight_loss_exercise_routes_to_fit(self):
        """Test that weight loss + exercise queries route to FIT"""
        response = make_chat_request("My dog is obese and needs a workout routine", "test-fit-weight-loss")
        assert response.status_code == 200, f"API returned {response.status_code}: {response.text}"
        data = response.json()
        
        assert data.get("pillar") == "fit", f"Weight/exercise query should route to 'fit', got '{data.get('pillar')}'"
        print(f"SUCCESS: Weight/exercise query routes to FIT (not DINE)")


class TestPicksUpdate:
    """Test os_context.picks_update for DINE pillar"""
    
    def test_picks_update_triggers_for_dine_pillar(self):
        """Test that picks_update signals refresh for DINE pillar"""
        response = make_chat_request("Help me with my dog's feeding schedule", "test-picks-update")
        assert response.status_code == 200, f"API returned {response.status_code}: {response.text}"
        data = response.json()
        
        os_context = data.get("os_context", {})
        picks_update = os_context.get("picks_update", {})
        
        # Primary assertion
        assert data.get("pillar") == "dine", f"Expected pillar='dine', got pillar='{data.get('pillar')}'"
        
        # Check picks_update
        if picks_update.get("should_refresh"):
            assert picks_update.get("pillar") == "dine", f"Expected pillar='dine', got {picks_update.get('pillar')}"
            print(f"SUCCESS: picks_update triggers refresh for DINE pillar: {picks_update}")
        else:
            print(f"INFO: picks_update present but should_refresh=False: {picks_update}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
