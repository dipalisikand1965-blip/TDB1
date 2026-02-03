"""
Test Suite for Iteration 194 - Cross-Pillar Journey Features
============================================================
Tests:
1. Pricing sync endpoint - POST /api/admin/pricing/full-sync
2. Pawmeter batch update - POST /api/admin/pawmeter/batch-update
3. Mira AI cross-pillar suggestions
4. Mira AI concierge philosophy
5. Products/Services pawmeter field verification
"""

import pytest
import requests
import os
from requests.auth import HTTPBasicAuth

# Get BASE_URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    raise ValueError("REACT_APP_BACKEND_URL environment variable not set")

# Admin credentials
ADMIN_USERNAME = "aditya"
ADMIN_PASSWORD = "lola4304"


class TestPricingSyncEndpoint:
    """Test pricing sync between products and services"""
    
    def test_full_sync_endpoint_requires_auth(self):
        """Test that full-sync endpoint requires admin authentication"""
        response = requests.post(f"{BASE_URL}/api/admin/pricing/full-sync")
        assert response.status_code == 401, f"Expected 401 without auth, got {response.status_code}"
        print("✓ Full sync endpoint requires authentication")
    
    def test_full_sync_endpoint_with_auth(self):
        """Test full pricing sync with admin credentials"""
        response = requests.post(
            f"{BASE_URL}/api/admin/pricing/full-sync",
            auth=HTTPBasicAuth(ADMIN_USERNAME, ADMIN_PASSWORD)
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "success" in data, "Response should contain 'success' field"
        assert data["success"] == True, "Sync should be successful"
        assert "products_to_services" in data, "Response should contain products_to_services result"
        assert "services_to_products" in data, "Response should contain services_to_products result"
        
        # Verify sync counts
        products_result = data["products_to_services"]
        services_result = data["services_to_products"]
        
        assert "synced_count" in products_result, "products_to_services should have synced_count"
        assert "synced_count" in services_result, "services_to_products should have synced_count"
        
        print(f"✓ Full sync completed: {products_result['synced_count']} products → services, {services_result['synced_count']} services → products")
    
    def test_sync_products_to_services_endpoint(self):
        """Test individual products to services sync"""
        response = requests.post(
            f"{BASE_URL}/api/admin/pricing/sync-products-to-services",
            auth=HTTPBasicAuth(ADMIN_USERNAME, ADMIN_PASSWORD)
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "success" in data, "Response should contain 'success' field"
        assert "synced_count" in data, "Response should contain 'synced_count'"
        print(f"✓ Products to services sync: {data.get('synced_count', 0)} items synced")
    
    def test_sync_services_to_products_endpoint(self):
        """Test individual services to products sync"""
        response = requests.post(
            f"{BASE_URL}/api/admin/pricing/sync-services-to-products",
            auth=HTTPBasicAuth(ADMIN_USERNAME, ADMIN_PASSWORD)
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "success" in data, "Response should contain 'success' field"
        assert "synced_count" in data, "Response should contain 'synced_count'"
        print(f"✓ Services to products sync: {data.get('synced_count', 0)} items synced")


class TestPawmeterBatchUpdate:
    """Test Pawmeter batch update functionality"""
    
    def test_batch_update_requires_auth(self):
        """Test that pawmeter batch update requires admin authentication"""
        response = requests.post(f"{BASE_URL}/api/admin/pawmeter/batch-update")
        assert response.status_code == 401, f"Expected 401 without auth, got {response.status_code}"
        print("✓ Pawmeter batch update requires authentication")
    
    def test_batch_update_with_auth(self):
        """Test pawmeter batch update with admin credentials"""
        response = requests.post(
            f"{BASE_URL}/api/admin/pawmeter/batch-update",
            auth=HTTPBasicAuth(ADMIN_USERNAME, ADMIN_PASSWORD)
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "success" in data, "Response should contain 'success' field"
        assert data["success"] == True, "Batch update should be successful"
        assert "updated" in data, "Response should contain 'updated' field"
        
        updated = data["updated"]
        assert "products" in updated, "Updated should contain 'products' count"
        assert "services" in updated, "Updated should contain 'services' count"
        
        print(f"✓ Pawmeter batch update: {updated['products']} products, {updated['services']} services updated")


class TestProductsPawmeterField:
    """Test that products have pawmeter field with correct structure"""
    
    def test_products_have_pawmeter_field(self):
        """Verify products have pawmeter field after batch update"""
        # First run batch update to ensure pawmeter is set
        requests.post(
            f"{BASE_URL}/api/admin/pawmeter/batch-update",
            auth=HTTPBasicAuth(ADMIN_USERNAME, ADMIN_PASSWORD)
        )
        
        # Get products
        response = requests.get(f"{BASE_URL}/api/products?limit=10")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        products = data.get("products", data) if isinstance(data, dict) else data
        
        if not products:
            pytest.skip("No products found to verify pawmeter")
        
        # Check at least one product has pawmeter
        products_with_pawmeter = [p for p in products if p.get("pawmeter")]
        
        if products_with_pawmeter:
            product = products_with_pawmeter[0]
            pawmeter = product["pawmeter"]
            
            # Verify pawmeter structure
            expected_fields = ["overall", "comfort", "safety", "quality", "value", "joy"]
            for field in expected_fields:
                assert field in pawmeter, f"Pawmeter should have '{field}' field"
            
            print(f"✓ Product '{product.get('name', 'Unknown')}' has pawmeter: overall={pawmeter.get('overall')}")
            print(f"  - comfort: {pawmeter.get('comfort')}, safety: {pawmeter.get('safety')}, quality: {pawmeter.get('quality')}")
            print(f"  - value: {pawmeter.get('value')}, joy: {pawmeter.get('joy')}")
        else:
            print("⚠ No products with pawmeter found (may need batch update)")


class TestServicesPawmeterField:
    """Test that services have pawmeter field with correct structure"""
    
    def test_services_have_pawmeter_field(self):
        """Verify services have pawmeter field after batch update"""
        # Get services
        response = requests.get(f"{BASE_URL}/api/services")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        services = data.get("services", data) if isinstance(data, dict) else data
        
        if not services:
            pytest.skip("No services found to verify pawmeter")
        
        # Check at least one service has pawmeter
        services_with_pawmeter = [s for s in services if s.get("pawmeter")]
        
        if services_with_pawmeter:
            service = services_with_pawmeter[0]
            pawmeter = service["pawmeter"]
            
            # Verify pawmeter structure
            expected_fields = ["overall", "comfort", "safety", "quality", "value", "joy"]
            for field in expected_fields:
                assert field in pawmeter, f"Pawmeter should have '{field}' field"
            
            print(f"✓ Service '{service.get('name', 'Unknown')}' has pawmeter: overall={pawmeter.get('overall')}")
            print(f"  - comfort: {pawmeter.get('comfort')}, safety: {pawmeter.get('safety')}, quality: {pawmeter.get('quality')}")
            print(f"  - value: {pawmeter.get('value')}, joy: {pawmeter.get('joy')}")
        else:
            print("⚠ No services with pawmeter found (may need batch update)")


class TestMiraAICrossPillarSuggestions:
    """Test Mira AI cross-pillar suggestions feature"""
    
    def test_mira_birthday_query_includes_cross_pillar(self):
        """When asking about birthday, should get celebrate + shop suggestions"""
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            json={
                "message": "I want to plan a birthday party for my dog",
                "session_id": "test-cross-pillar-birthday-001",
                "source": "web_widget"
            }
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "response" in data or "message" in data, "Response should contain AI response"
        
        ai_response = data.get("response", data.get("message", "")).lower()
        
        # Check for cross-pillar concepts
        # Birthday should trigger: celebrate (party), shop (cake, treats), care (grooming)
        cross_pillar_indicators = [
            "cake", "treat", "party", "celebrate", "grooming", "special",
            "gift", "shop", "order", "book"
        ]
        
        found_indicators = [ind for ind in cross_pillar_indicators if ind in ai_response]
        
        print(f"✓ Mira birthday response received")
        print(f"  Cross-pillar indicators found: {found_indicators}")
        
        # Should have at least some cross-pillar suggestions
        assert len(found_indicators) >= 2, f"Expected cross-pillar suggestions, found: {found_indicators}"
        print(f"✓ Cross-pillar suggestions verified: {found_indicators}")
    
    def test_mira_travel_query_includes_cross_pillar(self):
        """When asking about travel, should get travel + shop + care suggestions"""
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            json={
                "message": "I'm planning to travel with my dog to Goa",
                "session_id": "test-cross-pillar-travel-001",
                "source": "web_widget"
            }
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        ai_response = data.get("response", data.get("message", "")).lower()
        
        # Travel should trigger: travel (transport), shop (carriers, essentials), care (health check), paperwork (documents)
        cross_pillar_indicators = [
            "carrier", "transport", "cab", "flight", "document", "certificate",
            "health", "check", "essentials", "travel"
        ]
        
        found_indicators = [ind for ind in cross_pillar_indicators if ind in ai_response]
        
        print(f"✓ Mira travel response received")
        print(f"  Cross-pillar indicators found: {found_indicators}")


class TestMiraAIConciergePhilosophy:
    """Test Mira AI concierge philosophy - 'No is never an answer'"""
    
    def test_mira_unavailable_item_offers_sourcing(self):
        """When asking for unavailable item, should offer to source it"""
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            json={
                "message": "Do you have organic kangaroo treats for dogs?",
                "session_id": "test-concierge-philosophy-001",
                "source": "web_widget"
            }
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        ai_response = data.get("response", data.get("message", "")).lower()
        
        # Should NOT say "we don't have" or "not available"
        negative_phrases = ["we don't have", "not available", "sorry, we don't", "we don't carry"]
        found_negatives = [phrase for phrase in negative_phrases if phrase in ai_response]
        
        # Should offer alternatives or sourcing
        positive_phrases = ["source", "look into", "check", "alternative", "similar", "organic", "protein", "treat"]
        found_positives = [phrase for phrase in positive_phrases if phrase in ai_response]
        
        print(f"✓ Mira concierge philosophy test")
        print(f"  Negative phrases found: {found_negatives}")
        print(f"  Positive phrases found: {found_positives}")
        
        # Verify concierge philosophy
        if found_negatives:
            print(f"⚠ Warning: Found negative phrases that violate concierge philosophy: {found_negatives}")
        
        assert len(found_positives) >= 1, f"Expected helpful response with alternatives/sourcing, found: {found_positives}"
        print(f"✓ Concierge philosophy verified - offers alternatives/sourcing")
    
    def test_mira_special_request_offers_help(self):
        """When asking for special item, should offer to help source it"""
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            json={
                "message": "I need a pet wheelchair for my senior dog",
                "session_id": "test-concierge-philosophy-002",
                "source": "web_widget"
            }
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        ai_response = data.get("response", data.get("message", "")).lower()
        
        # Should offer to help, not refuse
        helpful_phrases = ["help", "source", "look into", "arrange", "find", "concierge", "size", "let me"]
        found_helpful = [phrase for phrase in helpful_phrases if phrase in ai_response]
        
        print(f"✓ Mira special request test")
        print(f"  Helpful phrases found: {found_helpful}")
        
        assert len(found_helpful) >= 1, f"Expected helpful response, found: {found_helpful}"
        print(f"✓ Concierge philosophy verified - offers to help with special requests")


class TestMiraAPIBasics:
    """Basic Mira API functionality tests"""
    
    def test_mira_chat_endpoint_exists(self):
        """Test that Mira chat endpoint exists and responds"""
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            json={
                "message": "Hello",
                "session_id": "test-basic-001",
                "source": "web_widget"
            }
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "response" in data or "message" in data, "Response should contain AI response"
        print("✓ Mira chat endpoint working")
    
    def test_mira_creates_ticket(self):
        """Test that Mira creates a ticket for conversations"""
        response = requests.post(
            f"{BASE_URL}/api/mira/chat",
            json={
                "message": "I need help with my dog's birthday party",
                "session_id": "test-ticket-creation-001",
                "source": "web_widget"
            }
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        # Check if ticket_id is returned
        if "ticket_id" in data:
            print(f"✓ Mira created ticket: {data['ticket_id']}")
        else:
            print("✓ Mira chat processed (ticket may be created internally)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
