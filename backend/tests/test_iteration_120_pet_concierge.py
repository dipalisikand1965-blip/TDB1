"""
Iteration 120: Pet Soul Journey & Concierge Command Center API Tests
=====================================================================
Tests for:
1. Pet page data API: GET /api/pets/{petId}
2. Pet Soul Score API: GET /api/pet-score/{petId}/score_state
3. Concierge queue API: GET /api/concierge/queue
4. Ticket detail APIs: GET /api/concierge/item/{ticket_id}
5. Sample tickets search in queue
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test data
TEST_PET_ID = "pet-99a708f1722a"
SAMPLE_TICKET_IDS = ["TKT-SAMPLE-001", "TKT-SAMPLE-002", "TKT-SAMPLE-003", "TKT-MIRA-001"]


class TestHealthCheck:
    """Basic health check to ensure API is running"""
    
    def test_api_health(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        print(f"✓ API health check passed: {data}")


class TestPetDataAPI:
    """Tests for Pet data retrieval API"""
    
    def test_get_pet_by_id(self):
        """Test GET /api/pets/{petId} returns pet data"""
        response = requests.get(f"{BASE_URL}/api/pets/{TEST_PET_ID}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["id"] == TEST_PET_ID
        assert "name" in data
        assert "breed" in data
        assert "species" in data
        print(f"✓ Pet data retrieved: {data['name']} ({data['breed']})")
    
    def test_pet_has_soul_data(self):
        """Test pet data includes soul/personality information"""
        response = requests.get(f"{BASE_URL}/api/pets/{TEST_PET_ID}")
        assert response.status_code == 200
        
        data = response.json()
        assert "soul" in data or "doggy_soul_answers" in data
        print(f"✓ Pet soul data present")
    
    def test_pet_has_celebrations(self):
        """Test pet data includes celebrations"""
        response = requests.get(f"{BASE_URL}/api/pets/{TEST_PET_ID}")
        assert response.status_code == 200
        
        data = response.json()
        assert "celebrations" in data
        assert isinstance(data["celebrations"], list)
        print(f"✓ Pet has {len(data['celebrations'])} celebrations")
    
    def test_pet_not_found(self):
        """Test 404 for non-existent pet"""
        response = requests.get(f"{BASE_URL}/api/pets/non-existent-pet-id")
        assert response.status_code == 404
        print(f"✓ Non-existent pet returns 404")


class TestPetScoreAPI:
    """Tests for Pet Soul Score API"""
    
    def test_get_pet_score_state(self):
        """Test GET /api/pet-score/{petId}/score_state returns score data"""
        response = requests.get(f"{BASE_URL}/api/pet-score/{TEST_PET_ID}/score_state")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["pet_id"] == TEST_PET_ID
        assert "score" in data
        assert "tier" in data
        assert "categories" in data
        print(f"✓ Pet score retrieved: {data['score']} - Tier: {data['tier']['name']}")
    
    def test_pet_score_has_categories(self):
        """Test pet score includes category breakdown"""
        response = requests.get(f"{BASE_URL}/api/pet-score/{TEST_PET_ID}/score_state")
        assert response.status_code == 200
        
        data = response.json()
        categories = data["categories"]
        expected_categories = ["safety", "personality", "lifestyle", "nutrition", "training", "relationships"]
        
        for cat in expected_categories:
            assert cat in categories, f"Missing category: {cat}"
            assert "earned" in categories[cat]
            assert "possible" in categories[cat]
            assert "percentage" in categories[cat]
        
        print(f"✓ All {len(expected_categories)} score categories present")
    
    def test_pet_score_has_tier_info(self):
        """Test pet score includes tier and next tier info"""
        response = requests.get(f"{BASE_URL}/api/pet-score/{TEST_PET_ID}/score_state")
        assert response.status_code == 200
        
        data = response.json()
        tier = data["tier"]
        assert "key" in tier
        assert "name" in tier
        assert "emoji" in tier
        assert "benefits" in tier
        
        if "next_tier" in data and data["next_tier"]:
            next_tier = data["next_tier"]
            assert "points_needed" in next_tier
            print(f"✓ Current tier: {tier['name']}, Points to next: {next_tier.get('points_needed', 'N/A')}")
        else:
            print(f"✓ Current tier: {tier['name']} (max tier)")
    
    def test_pet_score_has_recommendations(self):
        """Test pet score includes recommendations"""
        response = requests.get(f"{BASE_URL}/api/pet-score/{TEST_PET_ID}/score_state")
        assert response.status_code == 200
        
        data = response.json()
        assert "recommendations" in data
        recommendations = data["recommendations"]
        assert "next_question" in recommendations or "high_impact_missing" in recommendations
        print(f"✓ Score recommendations present")


class TestConciergeQueueAPI:
    """Tests for Concierge Command Center Queue API"""
    
    def test_get_queue(self):
        """Test GET /api/concierge/queue returns queue items"""
        response = requests.get(f"{BASE_URL}/api/concierge/queue")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "items" in data
        assert "total" in data
        assert "attention" in data
        assert "buckets" in data
        print(f"✓ Queue retrieved: {data['total']} items")
    
    def test_queue_has_priority_buckets(self):
        """Test queue includes priority bucket counts"""
        response = requests.get(f"{BASE_URL}/api/concierge/queue")
        assert response.status_code == 200
        
        data = response.json()
        buckets = data["buckets"]
        expected_buckets = ["urgent", "high", "medium", "low"]
        
        for bucket in expected_buckets:
            assert bucket in buckets
        
        print(f"✓ Priority buckets: urgent={buckets['urgent']}, high={buckets['high']}, medium={buckets['medium']}, low={buckets['low']}")
    
    def test_queue_has_attention_stats(self):
        """Test queue includes attention statistics"""
        response = requests.get(f"{BASE_URL}/api/concierge/queue")
        assert response.status_code == 200
        
        data = response.json()
        attention = data["attention"]
        assert "sla_breaching" in attention
        assert "high_unclaimed" in attention
        print(f"✓ Attention stats: SLA breaching={attention['sla_breaching']}, High unclaimed={attention['high_unclaimed']}")
    
    def test_queue_items_have_required_fields(self):
        """Test queue items have required fields"""
        response = requests.get(f"{BASE_URL}/api/concierge/queue")
        assert response.status_code == 200
        
        data = response.json()
        if data["items"]:
            item = data["items"][0]
            required_fields = ["ticket_id", "source_type", "priority_score", "priority_bucket"]
            for field in required_fields:
                assert field in item, f"Missing field: {field}"
            print(f"✓ Queue items have required fields")
        else:
            print(f"✓ Queue is empty (no items to validate)")
    
    def test_queue_search_by_ticket_id(self):
        """Test queue search functionality by ticket_id"""
        response = requests.get(f"{BASE_URL}/api/concierge/queue?search=TKT-SAMPLE")
        assert response.status_code == 200
        
        data = response.json()
        assert "items" in data
        # Should find sample tickets
        if data["items"]:
            for item in data["items"]:
                assert "TKT-SAMPLE" in item["ticket_id"].upper() or "sample" in str(item).lower()
            print(f"✓ Search found {len(data['items'])} items matching 'TKT-SAMPLE'")
        else:
            print(f"✓ Search returned 0 items (sample tickets may not be in queue)")
    
    def test_queue_filter_by_source(self):
        """Test queue filtering by source type"""
        response = requests.get(f"{BASE_URL}/api/concierge/queue?source=mira")
        assert response.status_code == 200
        
        data = response.json()
        assert "items" in data
        print(f"✓ Mira source filter returned {len(data['items'])} items")


class TestTicketDetailAPI:
    """Tests for Ticket Detail API"""
    
    def test_get_sample_ticket_001(self):
        """Test GET /api/concierge/item/TKT-SAMPLE-001"""
        response = requests.get(f"{BASE_URL}/api/concierge/item/TKT-SAMPLE-001")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert "item" in data
        assert data["item"]["ticket_id"] == "TKT-SAMPLE-001"
        assert "source_collection" in data
        assert "mira_intelligence" in data
        print(f"✓ TKT-SAMPLE-001 retrieved: {data['item'].get('subject', 'No subject')}")
    
    def test_get_sample_ticket_002(self):
        """Test GET /api/concierge/item/TKT-SAMPLE-002"""
        response = requests.get(f"{BASE_URL}/api/concierge/item/TKT-SAMPLE-002")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["item"]["ticket_id"] == "TKT-SAMPLE-002"
        assert data["item"]["pillar"] == "celebrate"
        print(f"✓ TKT-SAMPLE-002 retrieved: {data['item'].get('subject', 'No subject')}")
    
    def test_get_sample_ticket_003(self):
        """Test GET /api/concierge/item/TKT-SAMPLE-003"""
        response = requests.get(f"{BASE_URL}/api/concierge/item/TKT-SAMPLE-003")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["item"]["ticket_id"] == "TKT-SAMPLE-003"
        assert data["item"]["pillar"] == "shop"
        print(f"✓ TKT-SAMPLE-003 retrieved: {data['item'].get('subject', 'No subject')}")
    
    def test_get_mira_ticket_001(self):
        """Test GET /api/concierge/item/TKT-MIRA-001 (service_desk_tickets collection)"""
        response = requests.get(f"{BASE_URL}/api/concierge/item/TKT-MIRA-001")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data["item"]["ticket_id"] == "TKT-MIRA-001"
        assert data["source_collection"] == "service_desk_tickets"
        print(f"✓ TKT-MIRA-001 retrieved from service_desk_tickets collection")
    
    def test_ticket_detail_has_mira_intelligence(self):
        """Test ticket detail includes Mira intelligence data"""
        response = requests.get(f"{BASE_URL}/api/concierge/item/TKT-SAMPLE-001")
        assert response.status_code == 200
        
        data = response.json()
        mira = data["mira_intelligence"]
        expected_fields = ["past_orders", "past_tickets", "memories", "pet_soul_insights"]
        
        for field in expected_fields:
            assert field in mira, f"Missing Mira intelligence field: {field}"
        
        print(f"✓ Mira intelligence data present with {len(mira['past_orders'])} past orders, {len(mira['past_tickets'])} past tickets")
    
    def test_ticket_detail_has_timeline(self):
        """Test ticket detail includes timeline/audit trail"""
        response = requests.get(f"{BASE_URL}/api/concierge/item/TKT-SAMPLE-001")
        assert response.status_code == 200
        
        data = response.json()
        assert "timeline" in data
        assert isinstance(data["timeline"], list)
        print(f"✓ Timeline present with {len(data['timeline'])} entries")
    
    def test_ticket_not_found(self):
        """Test 404 for non-existent ticket"""
        response = requests.get(f"{BASE_URL}/api/concierge/item/NON-EXISTENT-TICKET")
        assert response.status_code == 404
        print(f"✓ Non-existent ticket returns 404")


class TestSearchTicketsInQueue:
    """Tests for searching sample tickets in queue"""
    
    def test_search_mira_ticket_in_queue(self):
        """Test searching for TKT-MIRA-001 in queue"""
        response = requests.get(f"{BASE_URL}/api/concierge/queue?search=TKT-MIRA-001")
        assert response.status_code == 200
        
        data = response.json()
        assert "items" in data
        
        # TKT-MIRA-001 should appear in results
        ticket_ids = [item["ticket_id"] for item in data["items"]]
        assert "TKT-MIRA-001" in ticket_ids, f"TKT-MIRA-001 not found in queue search results: {ticket_ids}"
        print(f"✓ TKT-MIRA-001 found in queue search")
    
    def test_search_sample_tickets_pattern(self):
        """Test searching for TKT-SAMPLE pattern in queue"""
        response = requests.get(f"{BASE_URL}/api/concierge/queue?search=TKT-SAMPLE")
        assert response.status_code == 200
        
        data = response.json()
        print(f"✓ Search for 'TKT-SAMPLE' returned {len(data['items'])} items")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
