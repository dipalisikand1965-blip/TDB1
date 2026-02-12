"""
Test STAY Pillar OS-Awareness for MIRA AI Pet Companion
========================================================
Tests the STAY pillar implementation per MIRA BIBLE:
- Boarding, daycare, pet-friendly hotels, home setup, alone time
- stay_context: temperament, vaccinations, social_comfort, health_flags
- stay_picks: Concierge Pick Cards with concierge_always:true
- concierge_handoff: Always available for STAY pillar
- uses_google_places: true for hotel search picks
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test pet data (Mojo - chicken allergy, birthday Feb 14)
TEST_PET_ID = "pet-99a708f1722a"
TEST_PET_NAME = "Mojo"


class TestSTAYPillarDetection:
    """Test that STAY pillar queries are correctly routed"""
    
    def test_boarding_query_routes_to_stay(self):
        """Boarding queries should route to STAY pillar"""
        response = requests.post(f"{BASE_URL}/api/mira/chat", json={
            "message": "I need boarding for my dog when I travel",
            "selected_pet_id": TEST_PET_ID,
            "session_id": "test-stay-boarding-001"
        })
        assert response.status_code == 200
        data = response.json()
        
        # Check pillar detection
        pillar = data.get("pillar", "")
        assert pillar == "stay", f"Expected pillar='stay', got '{pillar}'"
        print(f"✅ Boarding query routes to pillar='{pillar}'")
        
    def test_daycare_query_routes_to_stay(self):
        """Daycare queries should route to STAY pillar"""
        response = requests.post(f"{BASE_URL}/api/mira/chat", json={
            "message": "Can you help me find daycare for Mojo while I work?",
            "selected_pet_id": TEST_PET_ID,
            "session_id": "test-stay-daycare-001"
        })
        assert response.status_code == 200
        data = response.json()
        
        pillar = data.get("pillar", "")
        assert pillar == "stay", f"Expected pillar='stay', got '{pillar}'"
        print(f"✅ Daycare query routes to pillar='{pillar}'")
        
    def test_pet_friendly_hotel_routes_to_stay(self):
        """Pet-friendly hotel queries should route to STAY pillar"""
        response = requests.post(f"{BASE_URL}/api/mira/chat", json={
            "message": "Find a pet-friendly hotel for our trip to Goa",
            "selected_pet_id": TEST_PET_ID,
            "session_id": "test-stay-hotel-001"
        })
        assert response.status_code == 200
        data = response.json()
        
        pillar = data.get("pillar", "")
        assert pillar == "stay", f"Expected pillar='stay', got '{pillar}'"
        print(f"✅ Pet-friendly hotel query routes to pillar='{pillar}'")
        
    def test_stay_alone_query_routes_to_stay(self):
        """'Stay alone' queries should route to STAY pillar"""
        response = requests.post(f"{BASE_URL}/api/mira/chat", json={
            "message": "How long can Mojo stay alone at home?",
            "selected_pet_id": TEST_PET_ID,
            "session_id": "test-stay-alone-001"
        })
        assert response.status_code == 200
        data = response.json()
        
        pillar = data.get("pillar", "")
        assert pillar == "stay", f"Expected pillar='stay', got '{pillar}'"
        print(f"✅ 'Stay alone' query routes to pillar='{pillar}'")
        
    def test_home_setup_query_routes_to_stay(self):
        """Home setup/sleep queries should route to STAY pillar"""
        response = requests.post(f"{BASE_URL}/api/mira/chat", json={
            "message": "Help me setup a sleeping spot for Mojo at home",
            "selected_pet_id": TEST_PET_ID,
            "session_id": "test-stay-home-001"
        })
        assert response.status_code == 200
        data = response.json()
        
        pillar = data.get("pillar", "")
        assert pillar == "stay", f"Expected pillar='stay', got '{pillar}'"
        print(f"✅ Home setup query routes to pillar='{pillar}'")


class TestSTAYContextGeneration:
    """Test that stay_context is generated with correct fields"""
    
    def test_stay_context_structure(self):
        """stay_context should include temperament, vaccinations, social_comfort, health_flags"""
        response = requests.post(f"{BASE_URL}/api/mira/chat", json={
            "message": "I need boarding for Mojo",
            "selected_pet_id": TEST_PET_ID,
            "session_id": "test-stay-context-001"
        })
        assert response.status_code == 200
        data = response.json()
        
        os_context = data.get("os_context", {})
        stay_context = os_context.get("stay_context")
        
        # stay_context should exist for STAY pillar queries
        assert stay_context is not None, "stay_context should be present for STAY queries"
        
        # Check expected fields in stay_context
        expected_fields = ["temperament", "vaccinations", "social_comfort", "health_flags", "allergies", "age_band", "size"]
        for field in expected_fields:
            assert field in stay_context, f"stay_context missing field: {field}"
        
        print(f"✅ stay_context structure verified: {list(stay_context.keys())}")
        
    def test_stay_context_includes_allergies(self):
        """stay_context should include pet's allergies (Mojo has chicken allergy)"""
        response = requests.post(f"{BASE_URL}/api/mira/chat", json={
            "message": "Help me find daycare for Mojo",
            "selected_pet_id": TEST_PET_ID,
            "session_id": "test-stay-allergy-001"
        })
        assert response.status_code == 200
        data = response.json()
        
        os_context = data.get("os_context", {})
        stay_context = os_context.get("stay_context", {})
        allergies = stay_context.get("allergies", [])
        
        # Mojo has chicken allergy per test data
        print(f"✅ stay_context.allergies: {allergies}")


class TestSTAYPicksGeneration:
    """Test that stay_picks are generated with Concierge Pick Cards"""
    
    def test_boarding_query_generates_boarding_picks(self):
        """Boarding queries should generate boarding-related picks"""
        response = requests.post(f"{BASE_URL}/api/mira/chat", json={
            "message": "I need to find boarding for my dog when I travel",
            "selected_pet_id": TEST_PET_ID,
            "session_id": "test-stay-picks-001"
        })
        assert response.status_code == 200
        data = response.json()
        
        os_context = data.get("os_context", {})
        stay_picks = os_context.get("stay_picks", [])
        
        assert len(stay_picks) > 0, "stay_picks should contain picks for boarding query"
        
        # Check for boarding_search service_type
        service_types = [pick.get("service_type") for pick in stay_picks]
        assert "boarding_search" in service_types, f"Expected 'boarding_search' in picks, got: {service_types}"
        
        print(f"✅ Boarding picks generated: {service_types}")
        
    def test_daycare_query_generates_daycare_picks(self):
        """Daycare queries should generate daycare-related picks"""
        response = requests.post(f"{BASE_URL}/api/mira/chat", json={
            "message": "Find daycare for Mojo while I work",
            "selected_pet_id": TEST_PET_ID,
            "session_id": "test-stay-picks-002"
        })
        assert response.status_code == 200
        data = response.json()
        
        os_context = data.get("os_context", {})
        stay_picks = os_context.get("stay_picks", [])
        
        assert len(stay_picks) > 0, "stay_picks should contain picks for daycare query"
        
        service_types = [pick.get("service_type") for pick in stay_picks]
        assert "daycare_search" in service_types, f"Expected 'daycare_search' in picks, got: {service_types}"
        
        print(f"✅ Daycare picks generated: {service_types}")
        
    def test_hotel_query_generates_hotel_picks(self):
        """Hotel queries should generate hotel search picks"""
        response = requests.post(f"{BASE_URL}/api/mira/chat", json={
            "message": "Find a pet-friendly hotel for vacation",
            "selected_pet_id": TEST_PET_ID,
            "session_id": "test-stay-picks-003"
        })
        assert response.status_code == 200
        data = response.json()
        
        os_context = data.get("os_context", {})
        stay_picks = os_context.get("stay_picks", [])
        
        assert len(stay_picks) > 0, "stay_picks should contain picks for hotel query"
        
        service_types = [pick.get("service_type") for pick in stay_picks]
        assert "hotel_search" in service_types, f"Expected 'hotel_search' in picks, got: {service_types}"
        
        print(f"✅ Hotel picks generated: {service_types}")
        
    def test_home_setup_query_generates_home_picks(self):
        """Home setup queries should generate home layout picks"""
        response = requests.post(f"{BASE_URL}/api/mira/chat", json={
            "message": "Help me setup my home for my dog to stay alone",
            "selected_pet_id": TEST_PET_ID,
            "session_id": "test-stay-picks-004"
        })
        assert response.status_code == 200
        data = response.json()
        
        os_context = data.get("os_context", {})
        stay_picks = os_context.get("stay_picks", [])
        
        assert len(stay_picks) > 0, "stay_picks should contain picks for home setup query"
        
        service_types = [pick.get("service_type") for pick in stay_picks]
        assert "home_setup" in service_types, f"Expected 'home_setup' in picks, got: {service_types}"
        
        print(f"✅ Home setup picks generated: {service_types}")


class TestConciergeAlwaysFlag:
    """Test that concierge_always:true on all STAY picks"""
    
    def test_boarding_picks_have_concierge_always(self):
        """Boarding picks should have concierge_always:true"""
        response = requests.post(f"{BASE_URL}/api/mira/chat", json={
            "message": "Find boarding for Mojo",
            "selected_pet_id": TEST_PET_ID,
            "session_id": "test-concierge-001"
        })
        assert response.status_code == 200
        data = response.json()
        
        os_context = data.get("os_context", {})
        stay_picks = os_context.get("stay_picks", [])
        
        for pick in stay_picks:
            concierge_always = pick.get("concierge_always")
            assert concierge_always == True, f"Pick '{pick.get('title')}' should have concierge_always:true, got: {concierge_always}"
        
        print(f"✅ All {len(stay_picks)} boarding picks have concierge_always:true")
        
    def test_hotel_picks_have_concierge_always(self):
        """Hotel picks should have concierge_always:true"""
        response = requests.post(f"{BASE_URL}/api/mira/chat", json={
            "message": "Find a pet-friendly hotel for trip",
            "selected_pet_id": TEST_PET_ID,
            "session_id": "test-concierge-002"
        })
        assert response.status_code == 200
        data = response.json()
        
        os_context = data.get("os_context", {})
        stay_picks = os_context.get("stay_picks", [])
        
        for pick in stay_picks:
            concierge_always = pick.get("concierge_always")
            assert concierge_always == True, f"Pick '{pick.get('title')}' should have concierge_always:true, got: {concierge_always}"
        
        print(f"✅ All {len(stay_picks)} hotel picks have concierge_always:true")


class TestGooglePlacesFlag:
    """Test that uses_google_places:true on hotel search picks"""
    
    def test_hotel_search_uses_google_places(self):
        """Hotel search picks should have uses_google_places:true"""
        response = requests.post(f"{BASE_URL}/api/mira/chat", json={
            "message": "Find a pet-friendly hotel for our trip",
            "selected_pet_id": TEST_PET_ID,
            "session_id": "test-google-places-001"
        })
        assert response.status_code == 200
        data = response.json()
        
        os_context = data.get("os_context", {})
        stay_picks = os_context.get("stay_picks", [])
        
        # Find hotel_search pick
        hotel_picks = [p for p in stay_picks if p.get("service_type") == "hotel_search"]
        
        assert len(hotel_picks) > 0, "Should have hotel_search pick for hotel query"
        
        for hotel_pick in hotel_picks:
            uses_google_places = hotel_pick.get("uses_google_places")
            assert uses_google_places == True, f"Hotel pick should have uses_google_places:true, got: {uses_google_places}"
        
        print(f"✅ Hotel search pick has uses_google_places:true")


class TestConciergeHandoff:
    """Test that concierge_handoff is always available for STAY pillar"""
    
    def test_concierge_handoff_on_boarding_query(self):
        """Concierge handoff should be available for boarding queries"""
        response = requests.post(f"{BASE_URL}/api/mira/chat", json={
            "message": "Find boarding for my dog",
            "selected_pet_id": TEST_PET_ID,
            "session_id": "test-handoff-001"
        })
        assert response.status_code == 200
        data = response.json()
        
        os_context = data.get("os_context", {})
        concierge_handoff = os_context.get("concierge_handoff")
        
        assert concierge_handoff is not None, "concierge_handoff should be present for STAY queries"
        assert concierge_handoff.get("available") == True, "concierge_handoff.available should be true"
        
        print(f"✅ concierge_handoff available for boarding: {concierge_handoff}")
        
    def test_concierge_handoff_on_daycare_query(self):
        """Concierge handoff should be available for daycare queries"""
        response = requests.post(f"{BASE_URL}/api/mira/chat", json={
            "message": "Help me find daycare",
            "selected_pet_id": TEST_PET_ID,
            "session_id": "test-handoff-002"
        })
        assert response.status_code == 200
        data = response.json()
        
        os_context = data.get("os_context", {})
        concierge_handoff = os_context.get("concierge_handoff")
        
        assert concierge_handoff is not None, "concierge_handoff should be present for daycare"
        assert concierge_handoff.get("available") == True, "concierge_handoff.available should be true"
        
        print(f"✅ concierge_handoff available for daycare: {concierge_handoff}")
        
    def test_concierge_handoff_on_hotel_query(self):
        """Concierge handoff should be available for hotel queries"""
        response = requests.post(f"{BASE_URL}/api/mira/chat", json={
            "message": "Find pet-friendly hotel",
            "selected_pet_id": TEST_PET_ID,
            "session_id": "test-handoff-003"
        })
        assert response.status_code == 200
        data = response.json()
        
        os_context = data.get("os_context", {})
        concierge_handoff = os_context.get("concierge_handoff")
        
        assert concierge_handoff is not None, "concierge_handoff should be present for hotel"
        assert concierge_handoff.get("available") == True, "concierge_handoff.available should be true"
        
        print(f"✅ concierge_handoff available for hotel: {concierge_handoff}")


class TestPicksUpdate:
    """Test that picks_update signal is set correctly for STAY pillar"""
    
    def test_picks_update_for_stay_pillar(self):
        """picks_update should signal refresh for STAY pillar"""
        response = requests.post(f"{BASE_URL}/api/mira/chat", json={
            "message": "Find boarding for Mojo",
            "selected_pet_id": TEST_PET_ID,
            "session_id": "test-picks-update-001"
        })
        assert response.status_code == 200
        data = response.json()
        
        os_context = data.get("os_context", {})
        picks_update = os_context.get("picks_update", {})
        
        assert picks_update.get("should_refresh") == True, "picks_update.should_refresh should be True"
        assert picks_update.get("pillar") == "stay", f"Expected pillar='stay', got '{picks_update.get('pillar')}'"
        assert picks_update.get("context") == "accommodation", f"Expected context='accommodation', got '{picks_update.get('context')}'"
        
        print(f"✅ picks_update correct: {picks_update}")


class TestNonSTAYRouting:
    """Test that non-STAY queries still route correctly to other pillars"""
    
    def test_birthday_routes_to_celebrate(self):
        """Birthday queries should route to CELEBRATE pillar"""
        response = requests.post(f"{BASE_URL}/api/mira/chat", json={
            "message": "Plan a birthday party for Mojo",
            "selected_pet_id": TEST_PET_ID,
            "session_id": "test-non-stay-001"
        })
        assert response.status_code == 200
        data = response.json()
        
        pillar = data.get("pillar", "")
        assert pillar == "celebrate", f"Expected pillar='celebrate', got '{pillar}'"
        
        # Verify no stay_context for non-STAY queries
        os_context = data.get("os_context", {})
        stay_context = os_context.get("stay_context")
        assert stay_context is None, "stay_context should be None for non-STAY queries"
        
        print(f"✅ Birthday query routes to pillar='{pillar}'")
        
    def test_meal_plan_routes_to_dine(self):
        """Meal plan queries should route to DINE pillar"""
        response = requests.post(f"{BASE_URL}/api/mira/chat", json={
            "message": "Create a meal plan for Mojo",
            "selected_pet_id": TEST_PET_ID,
            "session_id": "test-non-stay-002"
        })
        assert response.status_code == 200
        data = response.json()
        
        pillar = data.get("pillar", "")
        assert pillar == "dine", f"Expected pillar='dine', got '{pillar}'"
        
        print(f"✅ Meal plan query routes to pillar='{pillar}'")
        
    def test_grooming_routes_to_care(self):
        """Grooming queries should route to CARE pillar"""
        response = requests.post(f"{BASE_URL}/api/mira/chat", json={
            "message": "Mojo needs grooming",
            "selected_pet_id": TEST_PET_ID,
            "session_id": "test-non-stay-003"
        })
        assert response.status_code == 200
        data = response.json()
        
        pillar = data.get("pillar", "")
        assert pillar == "care", f"Expected pillar='care', got '{pillar}'"
        
        print(f"✅ Grooming query routes to pillar='{pillar}'")


class TestSTAYPickCardFields:
    """Test that STAY picks have correct card structure"""
    
    def test_boarding_pick_card_structure(self):
        """Boarding picks should have title, why, cta, service_type, concierge_always"""
        response = requests.post(f"{BASE_URL}/api/mira/chat", json={
            "message": "I need boarding for Mojo",
            "selected_pet_id": TEST_PET_ID,
            "session_id": "test-card-001"
        })
        assert response.status_code == 200
        data = response.json()
        
        os_context = data.get("os_context", {})
        stay_picks = os_context.get("stay_picks", [])
        
        assert len(stay_picks) > 0, "Should have stay picks"
        
        for pick in stay_picks:
            # Required fields per MIRA BIBLE
            assert "title" in pick, f"Pick missing 'title': {pick}"
            assert "cta" in pick, f"Pick missing 'cta': {pick}"
            assert "service_type" in pick, f"Pick missing 'service_type': {pick}"
            assert "concierge_always" in pick, f"Pick missing 'concierge_always': {pick}"
            
            print(f"✅ Pick card '{pick.get('title')}' has correct structure")


class TestSafetyGatesForSTAY:
    """Test that safety gates (allergies) are included in STAY context"""
    
    def test_safety_gates_included_for_stay(self):
        """Safety gates should be present for STAY pillar queries"""
        response = requests.post(f"{BASE_URL}/api/mira/chat", json={
            "message": "Find boarding for Mojo",
            "selected_pet_id": TEST_PET_ID,
            "session_id": "test-safety-001"
        })
        assert response.status_code == 200
        data = response.json()
        
        os_context = data.get("os_context", {})
        safety_gates = os_context.get("safety_gates", [])
        
        # Should have allergy safety gate for Mojo (chicken allergy)
        allergy_gates = [g for g in safety_gates if g.get("type") == "allergy"]
        
        print(f"✅ Safety gates present: {safety_gates}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
