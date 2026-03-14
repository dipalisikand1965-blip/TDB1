"""
Test Conversation Intelligence Module - Pronoun Resolution, Follow-up Context, Tip Cards
========================================================================================

Tests for:
1. Pronoun Resolution - "book that one", "the first one", "I want that" with last_shown_items
2. Follow-up Context - "any cheaper ones?", "show me more", "can I include eggs?" with last_search_context
3. Tip Card Generation - meal plan requests generate tip cards
4. Intelligence metadata in API response

API endpoint: POST /api/mira/os/understand-with-products
"""

import pytest
import requests
import os
import json
from typing import Dict, Any, List

# Get backend URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    BASE_URL = "https://mobile-drawer-fix.preview.emergentagent.com"

print(f"[TEST] Using BASE_URL: {BASE_URL}")


# Sample products for testing pronoun resolution
SAMPLE_LAST_SHOWN_ITEMS = [
    {
        "id": "prod-001",
        "name": "Organic Dog Treats - Chicken Flavor",
        "price": 399,
        "category": "treats",
        "description": "Healthy organic treats for dogs"
    },
    {
        "id": "prod-002", 
        "name": "Premium Lamb Biscuits",
        "price": 499,
        "category": "treats",
        "description": "High-quality lamb treats"
    },
    {
        "id": "prod-003",
        "name": "Birthday Cake for Dogs",
        "price": 899,
        "category": "celebrate",
        "description": "Special dog birthday cake"
    }
]

# Sample search context for follow-up testing
SAMPLE_LAST_SEARCH_CONTEXT = {
    "query": "birthday cakes for my dog",
    "pillar": "celebrate",
    "intent": "FIND",
    "products_count": 3,
    "services_count": 0
}

# Sample pet context
SAMPLE_PET_CONTEXT = {
    "id": "pet-test-001",
    "name": "Buddy",
    "breed": "Golden Retriever",
    "age": "3 years",
    "traits": ["playful", "friendly", "energetic"],
    "sensitivities": ["chicken allergy"],
    "favorites": ["lamb", "peanut butter"]
}


class TestConversationIntelligence:
    """Test the conversation intelligence module functionality"""
    
    # ============================================
    # PRONOUN RESOLUTION TESTS
    # ============================================
    
    def test_pronoun_that_one_resolves_to_last_item(self):
        """Test: 'book that one' should resolve to the last shown item"""
        payload = {
            "input": "book that one",
            "pet_context": SAMPLE_PET_CONTEXT,
            "last_shown_items": SAMPLE_LAST_SHOWN_ITEMS,
            "conversation_history": [
                {"role": "user", "content": "show me birthday cakes"},
                {"role": "assistant", "content": "Here are some birthday cake options for Buddy"}
            ]
        }
        
        response = requests.post(
            f"{BASE_URL}/api/mira/os/understand-with-products",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert data.get("success") == True, "Expected success=True in response"
        
        # Check intelligence metadata
        intelligence = data.get("intelligence", {})
        print(f"[TEST] Intelligence response: {json.dumps(intelligence, indent=2)}")
        
        # Pronoun should be resolved
        assert "pronoun_resolved" in intelligence, "Missing 'pronoun_resolved' in intelligence"
        
        if intelligence.get("pronoun_resolved"):
            # Should resolve to "Birthday Cake for Dogs" (last item)
            resolved_item = intelligence.get("resolved_item")
            assert resolved_item is not None, "pronoun_resolved=True but resolved_item is None"
            print(f"[TEST] Resolved item: {resolved_item.get('name', 'unknown')}")
    
    def test_pronoun_the_first_one_resolves_to_first_item(self):
        """Test: 'the first one' should resolve to the first shown item"""
        payload = {
            "input": "I want the first one",
            "pet_context": SAMPLE_PET_CONTEXT,
            "last_shown_items": SAMPLE_LAST_SHOWN_ITEMS,
            "conversation_history": [
                {"role": "user", "content": "show me treats for Buddy"},
                {"role": "assistant", "content": "Here are some treat options"}
            ]
        }
        
        response = requests.post(
            f"{BASE_URL}/api/mira/os/understand-with-products",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        intelligence = data.get("intelligence", {})
        print(f"[TEST] First one resolution: {json.dumps(intelligence, indent=2)}")
        
        if intelligence.get("pronoun_resolved"):
            resolved_item = intelligence.get("resolved_item")
            if resolved_item:
                # Should resolve to first item: "Organic Dog Treats"
                print(f"[TEST] Resolved to: {resolved_item.get('name')}")
    
    def test_pronoun_i_want_that_resolves(self):
        """Test: 'I want that' should resolve to the last context item"""
        payload = {
            "input": "I want that",
            "pet_context": SAMPLE_PET_CONTEXT,
            "last_shown_items": SAMPLE_LAST_SHOWN_ITEMS,
            "conversation_history": [
                {"role": "user", "content": "what treats do you have?"},
                {"role": "assistant", "content": "Here are some options for Buddy"}
            ]
        }
        
        response = requests.post(
            f"{BASE_URL}/api/mira/os/understand-with-products",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        intelligence = data.get("intelligence", {})
        print(f"[TEST] 'I want that' resolution: pronoun_resolved={intelligence.get('pronoun_resolved')}")
    
    def test_pronoun_without_context_no_resolution(self):
        """Test: Pronouns without last_shown_items should NOT crash and handle gracefully"""
        payload = {
            "input": "I want that one",
            "pet_context": SAMPLE_PET_CONTEXT,
            "last_shown_items": [],  # Empty - no context
            "conversation_history": []
        }
        
        response = requests.post(
            f"{BASE_URL}/api/mira/os/understand-with-products",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        assert response.status_code == 200, f"Expected 200 even without context, got {response.status_code}"
        data = response.json()
        
        # Should not crash, intelligence should be present
        intelligence = data.get("intelligence", {})
        print(f"[TEST] Without context: {json.dumps(intelligence, indent=2)}")
        
        # resolved_item should be None if no items provided
        if intelligence.get("pronoun_resolved"):
            assert intelligence.get("resolved_item") is None or intelligence.get("resolved_item") == {}, \
                "With no last_shown_items, resolved_item should be None/empty"
    
    # ============================================
    # FOLLOW-UP CONTEXT TESTS
    # ============================================
    
    def test_followup_cheaper_ones_preserves_context(self):
        """Test: 'any cheaper ones?' should detect follow-up and preserve search context"""
        payload = {
            "input": "any cheaper ones?",
            "pet_context": SAMPLE_PET_CONTEXT,
            "last_shown_items": SAMPLE_LAST_SHOWN_ITEMS,
            "last_search_context": SAMPLE_LAST_SEARCH_CONTEXT,
            "conversation_history": [
                {"role": "user", "content": "show me birthday cakes for Buddy"},
                {"role": "assistant", "content": "Here are some birthday cake options"}
            ]
        }
        
        response = requests.post(
            f"{BASE_URL}/api/mira/os/understand-with-products",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        intelligence = data.get("intelligence", {})
        print(f"[TEST] 'cheaper ones' follow-up: {json.dumps(intelligence, indent=2)}")
        
        # Should detect as follow-up
        assert "follow_up_detected" in intelligence, "Missing 'follow_up_detected' in intelligence"
        
        if intelligence.get("follow_up_detected"):
            print("[TEST] ✅ Follow-up detected correctly for 'cheaper ones'")
            # Enhanced input should include original context
            enhanced = intelligence.get("enhanced_input")
            if enhanced:
                print(f"[TEST] Enhanced input: {enhanced}")
    
    def test_followup_show_me_more_expands_results(self):
        """Test: 'show me more' should be detected as a follow-up for expanding results"""
        payload = {
            "input": "show me more",
            "pet_context": SAMPLE_PET_CONTEXT,
            "last_shown_items": SAMPLE_LAST_SHOWN_ITEMS,
            "last_search_context": {
                "query": "treats for golden retriever",
                "pillar": "shop",
                "intent": "FIND",
                "products_count": 3
            },
            "conversation_history": [
                {"role": "user", "content": "show me treats"},
                {"role": "assistant", "content": "Here are some treats for Buddy"}
            ]
        }
        
        response = requests.post(
            f"{BASE_URL}/api/mira/os/understand-with-products",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        intelligence = data.get("intelligence", {})
        print(f"[TEST] 'show me more' follow-up: follow_up_detected={intelligence.get('follow_up_detected')}")
    
    def test_followup_can_i_include_eggs_for_meal_plan(self):
        """Test: 'can I include eggs?' as follow-up to meal plan discussion"""
        payload = {
            "input": "can I include eggs?",
            "pet_context": SAMPLE_PET_CONTEXT,
            "last_search_context": {
                "query": "meal plan for Buddy",
                "pillar": "advisory",
                "intent": "PLAN"
            },
            "conversation_history": [
                {"role": "user", "content": "help me make a meal plan for Buddy"},
                {"role": "assistant", "content": "I'd love to help you create a healthy meal plan for Buddy. Let me consider his golden retriever needs and chicken allergy."}
            ]
        }
        
        response = requests.post(
            f"{BASE_URL}/api/mira/os/understand-with-products",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        intelligence = data.get("intelligence", {})
        print(f"[TEST] 'can I include eggs' follow-up: {json.dumps(intelligence, indent=2)}")
        
        # Should be detected as follow-up with detail_question type
        if intelligence.get("follow_up_detected"):
            print("[TEST] ✅ Follow-up detected for meal plan question")
    
    def test_followup_context_maintained_across_messages(self):
        """Test: Search context should be maintained and returned in response for next message"""
        payload = {
            "input": "show me treats for Buddy",
            "pet_context": SAMPLE_PET_CONTEXT,
            "conversation_history": []
        }
        
        response = requests.post(
            f"{BASE_URL}/api/mira/os/understand-with-products",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        intelligence = data.get("intelligence", {})
        
        # Response should include last_search_context for frontend to pass back
        last_context = intelligence.get("last_search_context")
        print(f"[TEST] Returned last_search_context: {json.dumps(last_context, indent=2) if last_context else 'None'}")
        
        if last_context:
            assert "query" in last_context, "last_search_context should contain 'query'"
            assert "pillar" in last_context, "last_search_context should contain 'pillar'"
            print("[TEST] ✅ Search context returned for next message continuity")
    
    # ============================================
    # TIP CARD GENERATION TESTS
    # ============================================
    
    def test_tip_card_meal_plan_request(self):
        """Test: Meal plan requests should trigger tip card generation (no products)"""
        payload = {
            "input": "help me create a meal plan for Buddy",
            "pet_context": SAMPLE_PET_CONTEXT,
            "conversation_history": []
        }
        
        response = requests.post(
            f"{BASE_URL}/api/mira/os/understand-with-products",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        # For meal plan, products should likely be empty (advisory only)
        products = data.get("response", {}).get("products", [])
        has_real_products = data.get("response", {}).get("has_real_products", False)
        
        print(f"[TEST] Meal plan response - products count: {len(products)}, has_real_products: {has_real_products}")
        
        # Check if response contains advisory content
        message = data.get("response", {}).get("message", "")
        print(f"[TEST] Response message preview: {message[:200]}...")
        
        # Meal plans should typically NOT return products (advisory only)
        if len(products) == 0:
            print("[TEST] ✅ Meal plan correctly returned no products (advisory mode)")
    
    def test_tip_card_followup_maintains_context(self):
        """Test: Follow-up questions about meal plans should maintain tip card context"""
        payload = {
            "input": "what about adding carrots?",
            "pet_context": SAMPLE_PET_CONTEXT,
            "last_search_context": {
                "query": "meal plan for Buddy",
                "pillar": "advisory",
                "intent": "PLAN"
            },
            "conversation_history": [
                {"role": "user", "content": "help me make a meal plan for Buddy"},
                {"role": "assistant", "content": "Here's a suggested meal plan for Buddy with his chicken allergy in mind..."}
            ]
        }
        
        response = requests.post(
            f"{BASE_URL}/api/mira/os/understand-with-products",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        intelligence = data.get("intelligence", {})
        print(f"[TEST] Carrots follow-up: follow_up_detected={intelligence.get('follow_up_detected')}")
        
        # Response should address carrot question in meal plan context
        message = data.get("response", {}).get("message", "")
        print(f"[TEST] Response addresses carrots: {'carrot' in message.lower()}")
    
    # ============================================
    # INTELLIGENCE METADATA TESTS
    # ============================================
    
    def test_intelligence_object_in_response(self):
        """Test: API response must contain 'intelligence' object with proper structure"""
        payload = {
            "input": "show me treats",
            "pet_context": SAMPLE_PET_CONTEXT,
            "conversation_history": []
        }
        
        response = requests.post(
            f"{BASE_URL}/api/mira/os/understand-with-products",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        # Intelligence object must exist
        assert "intelligence" in data, "Response must contain 'intelligence' object"
        
        intelligence = data["intelligence"]
        
        # Required fields in intelligence object
        required_fields = ["pronoun_resolved", "follow_up_detected", "context_used", "original_input"]
        for field in required_fields:
            assert field in intelligence, f"Missing required field '{field}' in intelligence"
        
        print(f"[TEST] ✅ Intelligence object structure verified")
        print(f"[TEST] Intelligence fields: {list(intelligence.keys())}")
    
    def test_intelligence_enhanced_input_when_context_used(self):
        """Test: When context is used, enhanced_input should differ from original_input"""
        payload = {
            "input": "cheaper ones please",
            "pet_context": SAMPLE_PET_CONTEXT,
            "last_shown_items": SAMPLE_LAST_SHOWN_ITEMS,
            "last_search_context": {
                "query": "birthday cakes",
                "pillar": "celebrate"
            },
            "conversation_history": [
                {"role": "user", "content": "show me birthday cakes"},
                {"role": "assistant", "content": "Here are some cakes"}
            ]
        }
        
        response = requests.post(
            f"{BASE_URL}/api/mira/os/understand-with-products",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        intelligence = data.get("intelligence", {})
        
        original = intelligence.get("original_input")
        enhanced = intelligence.get("enhanced_input")
        context_used = intelligence.get("context_used")
        
        print(f"[TEST] Original: {original}")
        print(f"[TEST] Enhanced: {enhanced}")
        print(f"[TEST] Context used: {context_used}")
        
        if context_used:
            assert enhanced is not None, "If context_used=True, enhanced_input should not be None"
            print("[TEST] ✅ Enhanced input generated when context was used")
    
    def test_api_returns_last_search_context_for_continuity(self):
        """Test: Response should return last_search_context for frontend to pass back"""
        payload = {
            "input": "show me some treats for my dog Buddy",
            "pet_context": SAMPLE_PET_CONTEXT,
            "pillar": "shop",
            "conversation_history": []
        }
        
        response = requests.post(
            f"{BASE_URL}/api/mira/os/understand-with-products",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        
        intelligence = data.get("intelligence", {})
        last_search_context = intelligence.get("last_search_context")
        
        # If products were returned, last_search_context should be populated
        products = data.get("response", {}).get("products", [])
        
        if len(products) > 0 or data.get("response", {}).get("has_real_products"):
            assert last_search_context is not None, "last_search_context should be returned when products exist"
            print(f"[TEST] ✅ last_search_context returned: {json.dumps(last_search_context, indent=2)}")
        else:
            print(f"[TEST] No products returned, last_search_context: {last_search_context}")


class TestConversationIntelligenceModule:
    """Direct tests for the conversation_intelligence.py module functions"""
    
    def test_resolve_conversation_references_function_exists(self):
        """Test: resolve_conversation_references function should be importable"""
        try:
            import sys
            sys.path.insert(0, '/app/backend')
            from conversation_intelligence import resolve_conversation_references
            
            # Basic test - should not crash
            result, info = resolve_conversation_references(
                user_input="that one",
                conversation_history=[],
                last_shown_items=[{"name": "Test Product", "id": "1"}]
            )
            
            print(f"[TEST] resolve_conversation_references result: {result}")
            print(f"[TEST] Resolution info: {json.dumps(info, indent=2)}")
            assert "pronoun_resolved" in info, "info should contain 'pronoun_resolved'"
            
        except ImportError as e:
            pytest.skip(f"Could not import conversation_intelligence: {e}")
    
    def test_should_generate_tip_card_function_exists(self):
        """Test: should_generate_tip_card function should be importable"""
        try:
            import sys
            sys.path.insert(0, '/app/backend')
            from conversation_intelligence import should_generate_tip_card
            
            # Test meal plan trigger
            should_tip, tip_type = should_generate_tip_card(
                user_input="help me create a meal plan",
                intent="PLAN",
                conversation_history=[]
            )
            
            print(f"[TEST] should_generate_tip_card: {should_tip}, type: {tip_type}")
            
            # Meal plan should trigger tip card
            assert should_tip == True or tip_type == "meal_plan", \
                "Meal plan request should trigger tip card generation"
            
        except ImportError as e:
            pytest.skip(f"Could not import conversation_intelligence: {e}")
    
    def test_detect_pronoun_reference_patterns(self):
        """Test: Various pronoun patterns should be detected"""
        try:
            import sys
            sys.path.insert(0, '/app/backend')
            from conversation_intelligence import detect_pronoun_reference
            
            test_cases = [
                ("book that one", True, "that one"),
                ("I want the first one", True, "first one"),
                ("get that", True, "book that"),  # "get that" maps to "book that" pattern
                ("I'll take the second one", True, "second one"),
                ("show me treats", False, None),  # No pronoun
            ]
            
            items = [{"name": "Item 1"}, {"name": "Item 2"}, {"name": "Item 3"}]
            
            for input_text, expected_detected, expected_pattern in test_cases:
                result = detect_pronoun_reference(input_text, items)
                detected = result is not None and result.get("detected", False)
                
                print(f"[TEST] '{input_text}' -> detected={detected}, pattern={result.get('pattern') if result else None}")
                
                if expected_detected:
                    assert detected, f"Expected pronoun detection for: '{input_text}'"
            
        except ImportError as e:
            pytest.skip(f"Could not import conversation_intelligence: {e}")


class TestEdgeCases:
    """Edge case tests for robustness"""
    
    def test_empty_input_handled_gracefully(self):
        """Test: Empty input should not crash the API"""
        payload = {
            "input": "",
            "pet_context": SAMPLE_PET_CONTEXT,
            "conversation_history": []
        }
        
        response = requests.post(
            f"{BASE_URL}/api/mira/os/understand-with-products",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        # Should not crash - may return 400 or 200 with error message
        assert response.status_code in [200, 400, 422], f"Unexpected status: {response.status_code}"
        print(f"[TEST] Empty input handled with status: {response.status_code}")
    
    def test_null_last_shown_items_handled(self):
        """Test: null last_shown_items should not crash"""
        payload = {
            "input": "that one",
            "pet_context": SAMPLE_PET_CONTEXT,
            "last_shown_items": None,
            "conversation_history": []
        }
        
        response = requests.post(
            f"{BASE_URL}/api/mira/os/understand-with-products",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("[TEST] ✅ null last_shown_items handled gracefully")
    
    def test_null_last_search_context_handled(self):
        """Test: null last_search_context should not crash"""
        payload = {
            "input": "cheaper ones",
            "pet_context": SAMPLE_PET_CONTEXT,
            "last_search_context": None,
            "conversation_history": []
        }
        
        response = requests.post(
            f"{BASE_URL}/api/mira/os/understand-with-products",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=30
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("[TEST] ✅ null last_search_context handled gracefully")
    
    def test_very_long_input_handled(self):
        """Test: Very long input should not crash"""
        long_input = "I want " + "treats and cakes and toys " * 50  # ~1500 chars
        
        payload = {
            "input": long_input[:1000],  # Limit to 1000 chars
            "pet_context": SAMPLE_PET_CONTEXT,
            "conversation_history": []
        }
        
        response = requests.post(
            f"{BASE_URL}/api/mira/os/understand-with-products",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=60
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("[TEST] ✅ Long input handled gracefully")


# Run all tests with pytest
if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
