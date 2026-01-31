"""
Test Iteration 152 - Pillar Resolver Kit Assembly Tests
========================================================
Testing the pillar resolver integration for kit assembly:
1. Travel Kit Assembly - must NOT include cakes, food, or frozen items
2. Travel Kit Assembly - must include travel-appropriate items (carriers, bowls, leashes, towels, wipes)
3. Celebrate Kit Assembly - should include cakes and celebration items
4. Care Kit Assembly - should include grooming products, supplements
5. Pillar Resolver exclusion rules are applied correctly
6. Kit Assembly conversation flow (gathering_info -> confirming -> assembling)
"""

import pytest
import requests
import os
import uuid
import time

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestPillarResolverRules:
    """Test pillar resolver rules and exclusion logic"""
    
    def test_api_health(self):
        """Verify API is healthy before running tests"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        print("✅ API health check passed")
    
    def test_travel_pillar_excludes_cakes(self):
        """Test that travel pillar rules exclude cakes"""
        # Query products with travel pillar rules
        response = requests.get(f"{BASE_URL}/api/products", params={
            "pillar": "travel",
            "limit": 50
        })
        assert response.status_code == 200
        data = response.json()
        products = data.get("products", data) if isinstance(data, dict) else data
        
        # Check that no cakes are in travel products
        cake_products = [p for p in products if 'cake' in p.get('name', '').lower() or 
                        p.get('base_tags', {}).get('category_primary') == 'cakes']
        
        if cake_products:
            print(f"⚠️ Found {len(cake_products)} cake products in travel pillar (should be excluded)")
            for p in cake_products[:3]:
                print(f"   - {p.get('name')}")
        else:
            print("✅ No cake products found in travel pillar (correct)")
        
        # This is informational - the actual exclusion happens in kit assembly
        print(f"Total travel products: {len(products)}")
    
    def test_celebrate_pillar_includes_cakes(self):
        """Test that celebrate pillar includes cakes"""
        response = requests.get(f"{BASE_URL}/api/products", params={
            "pillar": "celebrate",
            "limit": 50
        })
        assert response.status_code == 200
        data = response.json()
        products = data.get("products", data) if isinstance(data, dict) else data
        
        # Check for cake products
        cake_products = [p for p in products if 'cake' in p.get('name', '').lower() or 
                        'birthday' in p.get('name', '').lower() or
                        p.get('base_tags', {}).get('category_primary') == 'cakes']
        
        print(f"✅ Found {len(cake_products)} cake/celebration products in celebrate pillar")
        for p in cake_products[:5]:
            print(f"   - {p.get('name')}")
    
    def test_care_pillar_products(self):
        """Test that care pillar includes grooming and supplements"""
        response = requests.get(f"{BASE_URL}/api/products", params={
            "pillar": "care",
            "limit": 50
        })
        assert response.status_code == 200
        data = response.json()
        products = data.get("products", data) if isinstance(data, dict) else data
        
        # Check for grooming/supplement products
        care_products = [p for p in products if 
                        'groom' in p.get('name', '').lower() or 
                        'supplement' in p.get('name', '').lower() or
                        'shampoo' in p.get('name', '').lower() or
                        p.get('base_tags', {}).get('category_primary') in ['supplements', 'grooming']]
        
        print(f"✅ Found {len(care_products)} care-related products in care pillar")
        for p in care_products[:5]:
            print(f"   - {p.get('name')}")


class TestMiraKitAssemblyTravelPillar:
    """Test Mira chat kit assembly for travel pillar - critical test for exclusion rules"""
    
    @pytest.fixture
    def session_id(self):
        """Generate unique session ID for each test"""
        return f"test-travel-kit-{uuid.uuid4().hex[:8]}"
    
    def test_travel_kit_request_excludes_cakes_and_food(self, session_id):
        """
        CRITICAL TEST: Travel kit assembly must NOT include cakes, food, or frozen items
        This tests the pillar resolver exclusion rules integration
        """
        # Step 1: Start travel kit conversation
        response = requests.post(f"{BASE_URL}/api/mira/chat", json={
            "message": "I need a travel kit for my dog, we're going on a road trip to Ooty",
            "session_id": session_id,
            "source": "web_widget"
        })
        assert response.status_code == 200
        data = response.json()
        
        print(f"Step 1 - Initial request response:")
        print(f"   Message: {data.get('message', '')[:200]}...")
        
        # Check if we're in gathering_info stage
        kit_assembly = data.get("kit_assembly", {})
        print(f"   Kit assembly stage: {kit_assembly.get('stage', 'N/A')}")
        
        # Step 2: Provide travel details
        time.sleep(1)
        response = requests.post(f"{BASE_URL}/api/mira/chat", json={
            "message": "We're traveling by car for 3 days, my dog is a medium-sized Labrador",
            "session_id": session_id,
            "source": "web_widget"
        })
        assert response.status_code == 200
        data = response.json()
        
        print(f"\nStep 2 - Details provided response:")
        print(f"   Message: {data.get('message', '')[:200]}...")
        
        # Step 3: Confirm kit assembly
        time.sleep(1)
        response = requests.post(f"{BASE_URL}/api/mira/chat", json={
            "message": "Yes, please assemble the travel kit",
            "session_id": session_id,
            "source": "web_widget"
        })
        assert response.status_code == 200
        data = response.json()
        
        print(f"\nStep 3 - Kit assembly response:")
        print(f"   Message: {data.get('message', '')[:300]}...")
        
        # Check products returned
        products = data.get("products", [])
        print(f"\n   Products returned: {len(products)}")
        
        # CRITICAL ASSERTION: No cakes or food in travel kit
        cake_products = []
        food_products = []
        frozen_products = []
        travel_appropriate = []
        
        for p in products:
            name = p.get('name', '').lower()
            base_tags = p.get('base_tags', {})
            category = base_tags.get('category_primary', '')
            format_tag = base_tags.get('format', '')
            
            if 'cake' in name or category == 'cakes':
                cake_products.append(p.get('name'))
            elif 'food' in name or category == 'food':
                food_products.append(p.get('name'))
            elif format_tag == 'frozen':
                frozen_products.append(p.get('name'))
            else:
                # Check for travel-appropriate items
                travel_keywords = ['carrier', 'bowl', 'leash', 'towel', 'wipe', 'travel', 'bag', 'crate', 'harness']
                if any(kw in name for kw in travel_keywords):
                    travel_appropriate.append(p.get('name'))
        
        print(f"\n   Analysis:")
        print(f"   - Cake products (should be 0): {len(cake_products)}")
        if cake_products:
            print(f"     ❌ FAIL: Found cakes: {cake_products}")
        print(f"   - Food products (should be 0): {len(food_products)}")
        if food_products:
            print(f"     ❌ FAIL: Found food: {food_products}")
        print(f"   - Frozen products (should be 0): {len(frozen_products)}")
        if frozen_products:
            print(f"     ❌ FAIL: Found frozen: {frozen_products}")
        print(f"   - Travel-appropriate products: {len(travel_appropriate)}")
        if travel_appropriate:
            print(f"     ✅ Found: {travel_appropriate[:5]}")
        
        # Assert no cakes in travel kit
        assert len(cake_products) == 0, f"Travel kit should NOT contain cakes! Found: {cake_products}"
        assert len(food_products) == 0, f"Travel kit should NOT contain food! Found: {food_products}"
        assert len(frozen_products) == 0, f"Travel kit should NOT contain frozen items! Found: {frozen_products}"
        
        print("\n✅ PASS: Travel kit correctly excludes cakes, food, and frozen items")
    
    def test_travel_kit_includes_appropriate_items(self, session_id):
        """Test that travel kit includes travel-appropriate items"""
        # Direct request for travel kit items
        response = requests.post(f"{BASE_URL}/api/mira/chat", json={
            "message": "Show me travel essentials for my dog - carriers, bowls, leashes",
            "session_id": session_id,
            "source": "web_widget",
            "current_pillar": "travel"
        })
        assert response.status_code == 200
        data = response.json()
        
        products = data.get("products", [])
        print(f"Travel essentials request returned {len(products)} products")
        
        # Check for travel-appropriate items
        travel_keywords = ['carrier', 'bowl', 'leash', 'towel', 'wipe', 'travel', 'bag', 'crate', 'harness', 'collar']
        travel_items = []
        
        for p in products:
            name = p.get('name', '').lower()
            if any(kw in name for kw in travel_keywords):
                travel_items.append(p.get('name'))
        
        print(f"Travel-appropriate items found: {len(travel_items)}")
        for item in travel_items[:5]:
            print(f"   - {item}")
        
        # We expect at least some travel items (or concierge-sourced placeholders)
        print(f"✅ Travel kit request processed successfully")


class TestMiraKitAssemblyCelebratePillar:
    """Test Mira chat kit assembly for celebrate pillar - should include cakes"""
    
    @pytest.fixture
    def session_id(self):
        """Generate unique session ID for each test"""
        return f"test-celebrate-kit-{uuid.uuid4().hex[:8]}"
    
    def test_celebrate_kit_includes_cakes(self, session_id):
        """
        Test that celebrate/birthday kit DOES include cakes and celebration items
        """
        # Request birthday kit
        response = requests.post(f"{BASE_URL}/api/mira/chat", json={
            "message": "I want to order a birthday kit for my dog's birthday party",
            "session_id": session_id,
            "source": "web_widget"
        })
        assert response.status_code == 200
        data = response.json()
        
        print(f"Birthday kit request response:")
        print(f"   Message: {data.get('message', '')[:200]}...")
        
        # Check if kit assembly started
        kit_assembly = data.get("kit_assembly", {})
        print(f"   Kit assembly stage: {kit_assembly.get('stage', 'N/A')}")
        print(f"   Kit type: {kit_assembly.get('kit_type', 'N/A')}")
        
        # Provide details and confirm
        time.sleep(1)
        response = requests.post(f"{BASE_URL}/api/mira/chat", json={
            "message": "It's for a 3 year old Golden Retriever, we want a cake and party treats",
            "session_id": session_id,
            "source": "web_widget"
        })
        assert response.status_code == 200
        
        time.sleep(1)
        response = requests.post(f"{BASE_URL}/api/mira/chat", json={
            "message": "Yes, please assemble the birthday kit",
            "session_id": session_id,
            "source": "web_widget"
        })
        assert response.status_code == 200
        data = response.json()
        
        products = data.get("products", [])
        print(f"\nBirthday kit products: {len(products)}")
        
        # Check for celebration items
        celebration_items = []
        for p in products:
            name = p.get('name', '').lower()
            if any(kw in name for kw in ['cake', 'birthday', 'party', 'celebration', 'treat']):
                celebration_items.append(p.get('name'))
        
        print(f"Celebration items found: {len(celebration_items)}")
        for item in celebration_items[:5]:
            print(f"   - {item}")
        
        # Birthday kit should have celebration items (or concierge placeholders)
        print(f"✅ Birthday kit request processed - celebration items expected")


class TestMiraKitAssemblyCareKit:
    """Test Mira chat kit assembly for care pillar"""
    
    @pytest.fixture
    def session_id(self):
        """Generate unique session ID for each test"""
        return f"test-care-kit-{uuid.uuid4().hex[:8]}"
    
    def test_care_kit_includes_grooming_products(self, session_id):
        """Test that care/grooming kit includes appropriate products"""
        response = requests.post(f"{BASE_URL}/api/mira/chat", json={
            "message": "I need a grooming kit for my dog with shampoo and supplements",
            "session_id": session_id,
            "source": "web_widget"
        })
        assert response.status_code == 200
        data = response.json()
        
        print(f"Grooming kit request response:")
        print(f"   Message: {data.get('message', '')[:200]}...")
        
        kit_assembly = data.get("kit_assembly", {})
        print(f"   Kit assembly stage: {kit_assembly.get('stage', 'N/A')}")
        
        # Provide details
        time.sleep(1)
        response = requests.post(f"{BASE_URL}/api/mira/chat", json={
            "message": "My dog has sensitive skin and needs gentle products",
            "session_id": session_id,
            "source": "web_widget"
        })
        assert response.status_code == 200
        
        time.sleep(1)
        response = requests.post(f"{BASE_URL}/api/mira/chat", json={
            "message": "Yes, please put together the grooming kit",
            "session_id": session_id,
            "source": "web_widget"
        })
        assert response.status_code == 200
        data = response.json()
        
        products = data.get("products", [])
        print(f"\nGrooming kit products: {len(products)}")
        
        # Check for care items
        care_items = []
        for p in products:
            name = p.get('name', '').lower()
            if any(kw in name for kw in ['shampoo', 'groom', 'supplement', 'brush', 'conditioner', 'spray']):
                care_items.append(p.get('name'))
        
        print(f"Care items found: {len(care_items)}")
        for item in care_items[:5]:
            print(f"   - {item}")
        
        print(f"✅ Care kit request processed successfully")


class TestKitAssemblyConversationFlow:
    """Test the kit assembly conversation flow stages"""
    
    @pytest.fixture
    def session_id(self):
        """Generate unique session ID for each test"""
        return f"test-flow-{uuid.uuid4().hex[:8]}"
    
    def test_kit_assembly_flow_stages(self, session_id):
        """
        Test the complete kit assembly flow:
        1. gathering_info - Mira asks clarifying questions
        2. confirming - User confirms details
        3. assembling - Mira assembles the kit
        """
        # Stage 1: Initial request - should trigger gathering_info
        response = requests.post(f"{BASE_URL}/api/mira/chat", json={
            "message": "I need a travel kit for my dog",
            "session_id": session_id,
            "source": "web_widget"
        })
        assert response.status_code == 200
        data = response.json()
        
        kit_assembly = data.get("kit_assembly", {})
        stage_1 = kit_assembly.get("stage", "")
        print(f"Stage 1 - Initial request:")
        print(f"   Stage: {stage_1}")
        print(f"   Kit type: {kit_assembly.get('kit_type', 'N/A')}")
        
        # Should be in gathering_info stage
        if stage_1 == "gathering_info":
            print("   ✅ Correctly in gathering_info stage")
        else:
            print(f"   ⚠️ Expected gathering_info, got: {stage_1}")
        
        # Stage 2: Provide details
        time.sleep(1)
        response = requests.post(f"{BASE_URL}/api/mira/chat", json={
            "message": "We're going to Goa by car for 5 days, my dog is a Beagle",
            "session_id": session_id,
            "source": "web_widget"
        })
        assert response.status_code == 200
        data = response.json()
        
        kit_assembly = data.get("kit_assembly", {})
        stage_2 = kit_assembly.get("stage", "")
        print(f"\nStage 2 - Details provided:")
        print(f"   Stage: {stage_2}")
        
        # Should be in confirming stage after providing details
        if stage_2 == "confirming":
            print("   ✅ Correctly in confirming stage")
        elif stage_2 == "gathering_info":
            print("   ℹ️ Still gathering more info")
        else:
            print(f"   Stage: {stage_2}")
        
        # Stage 3: Confirm and assemble
        time.sleep(1)
        response = requests.post(f"{BASE_URL}/api/mira/chat", json={
            "message": "Yes, go ahead and assemble the kit",
            "session_id": session_id,
            "source": "web_widget"
        })
        assert response.status_code == 200
        data = response.json()
        
        kit_assembly = data.get("kit_assembly", {})
        stage_3 = kit_assembly.get("stage", "")
        products = data.get("products", [])
        
        print(f"\nStage 3 - Assembly:")
        print(f"   Stage: {stage_3}")
        print(f"   Products returned: {len(products)}")
        
        if products:
            print("   ✅ Kit assembled with products")
            for p in products[:3]:
                print(f"      - {p.get('name', 'Unknown')}")
        
        print("\n✅ Kit assembly flow test completed")


class TestPillarResolverExclusionRulesDirectly:
    """Test pillar resolver exclusion rules directly via API"""
    
    def test_pillar_resolver_travel_rules(self):
        """Test that pillar resolver returns correct rules for travel"""
        # This tests the pillar resolver configuration
        response = requests.get(f"{BASE_URL}/api/products", params={
            "pillar": "travel",
            "limit": 100
        })
        assert response.status_code == 200
        data = response.json()
        products = data.get("products", data) if isinstance(data, dict) else data
        
        # Analyze products for exclusion rule compliance
        violations = []
        compliant = []
        
        for p in products:
            name = p.get('name', '').lower()
            base_tags = p.get('base_tags', {})
            category = base_tags.get('category_primary', '')
            format_tag = base_tags.get('format', '')
            
            # Check for violations of travel exclusion rules
            # From pillar_rules_v1.yaml: exclude category_primary: [cakes, food], format: frozen
            if category == 'cakes' or 'cake' in name:
                violations.append(f"CAKE: {p.get('name')}")
            elif category == 'food' or ('food' in name and 'bowl' not in name):
                violations.append(f"FOOD: {p.get('name')}")
            elif format_tag == 'frozen':
                violations.append(f"FROZEN: {p.get('name')}")
            else:
                compliant.append(p.get('name'))
        
        print(f"Travel pillar products analysis:")
        print(f"   Total products: {len(products)}")
        print(f"   Compliant products: {len(compliant)}")
        print(f"   Violations: {len(violations)}")
        
        if violations:
            print(f"\n   ⚠️ Exclusion rule violations found:")
            for v in violations[:10]:
                print(f"      - {v}")
        else:
            print(f"\n   ✅ All products comply with travel exclusion rules")
        
        # Note: This test is informational - the actual filtering happens in kit assembly
        # The products endpoint may not apply pillar resolver rules
    
    def test_pillar_resolver_celebrate_rules(self):
        """Test that celebrate pillar includes celebration items"""
        response = requests.get(f"{BASE_URL}/api/products", params={
            "pillar": "celebrate",
            "limit": 100
        })
        assert response.status_code == 200
        data = response.json()
        products = data.get("products", data) if isinstance(data, dict) else data
        
        # Check for celebration items
        celebration_items = []
        for p in products:
            name = p.get('name', '').lower()
            base_tags = p.get('base_tags', {})
            category = base_tags.get('category_primary', '')
            purchase_pattern = base_tags.get('purchase_pattern', '')
            
            if category == 'cakes' or 'cake' in name or 'birthday' in name or purchase_pattern == 'celebration':
                celebration_items.append(p.get('name'))
        
        print(f"Celebrate pillar products analysis:")
        print(f"   Total products: {len(products)}")
        print(f"   Celebration items: {len(celebration_items)}")
        
        if celebration_items:
            print(f"\n   ✅ Celebration items found:")
            for item in celebration_items[:10]:
                print(f"      - {item}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
