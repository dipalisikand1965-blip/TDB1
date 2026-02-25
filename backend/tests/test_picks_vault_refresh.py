"""
Test PicksVault functionality - Refresh Picks and Send to Concierge
Tests for:
1. /api/mira/refresh-picks - Show Different Options button backend
2. /api/mira/vault/send-to-concierge - Send to Concierge button backend
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestRefreshPicks:
    """Tests for the refresh-picks endpoint (Show Different Options button)"""
    
    def test_refresh_picks_basic(self):
        """Test basic refresh picks returns new products"""
        response = requests.post(
            f"{BASE_URL}/api/mira/refresh-picks",
            json={
                "pillar": "feed",
                "pet_context": {"name": "Mojo", "species": "dog"},
                "exclude_ids": [],
                "context": "show me treats"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify success
        assert data.get("success") == True
        
        # Verify picks returned
        assert "picks" in data
        assert isinstance(data["picks"], list)
        assert len(data["picks"]) > 0  # Should return at least 1 pick
        assert len(data["picks"]) <= 4  # Max 4 picks
        
        # Verify pick structure
        pick = data["picks"][0]
        assert "id" in pick
        assert "name" in pick
        assert "price" in pick or pick.get("price") is None
        assert "image" in pick
        
        print(f"✓ Refresh picks returned {len(data['picks'])} products")
    
    def test_refresh_picks_excludes_ids(self):
        """Test that refresh picks excludes specified product IDs"""
        # First get initial picks
        response1 = requests.post(
            f"{BASE_URL}/api/mira/refresh-picks",
            json={
                "pillar": "shop",
                "pet_context": {"name": "Luna", "species": "dog"},
                "exclude_ids": [],
                "context": "dog products"
            }
        )
        
        assert response1.status_code == 200
        initial_picks = response1.json()["picks"]
        initial_ids = [p["id"] for p in initial_picks if p.get("id")]
        
        # Now request new picks excluding the initial ones
        response2 = requests.post(
            f"{BASE_URL}/api/mira/refresh-picks",
            json={
                "pillar": "shop",
                "pet_context": {"name": "Luna", "species": "dog"},
                "exclude_ids": initial_ids,
                "context": "dog products"
            }
        )
        
        assert response2.status_code == 200
        data = response2.json()
        
        # Verify excluded_count is correct
        assert data.get("excluded_count") == len(initial_ids)
        
        # Verify new picks don't contain excluded IDs
        new_ids = [p["id"] for p in data["picks"] if p.get("id")]
        for new_id in new_ids:
            assert new_id not in initial_ids, f"Product {new_id} should have been excluded"
        
        print(f"✓ Refresh excluded {data['excluded_count']} products successfully")
    
    def test_refresh_picks_with_pillar(self):
        """Test refresh picks respects pillar filtering"""
        response = requests.post(
            f"{BASE_URL}/api/mira/refresh-picks",
            json={
                "pillar": "celebrate",
                "pet_context": {"name": "Buddy", "species": "dog"},
                "exclude_ids": [],
                "context": "birthday party"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        
        print(f"✓ Refresh picks with pillar 'celebrate' returned {len(data['picks'])} products")
    
    def test_refresh_picks_loading_state(self):
        """Test that refresh endpoint responds within acceptable time (simulating loading spinner)"""
        import time
        
        start_time = time.time()
        response = requests.post(
            f"{BASE_URL}/api/mira/refresh-picks",
            json={
                "pillar": "feed",
                "pet_context": {"name": "Max", "species": "dog"},
                "exclude_ids": [],
                "context": "treats"
            }
        )
        end_time = time.time()
        
        assert response.status_code == 200
        
        # Should respond within 5 seconds
        response_time = end_time - start_time
        assert response_time < 5.0, f"Response took too long: {response_time:.2f}s"
        
        print(f"✓ Refresh picks responded in {response_time:.2f}s")


class TestSendToConcierge:
    """Tests for the send-to-concierge endpoint (Send to Concierge button)"""
    
    def test_send_single_item_to_concierge(self):
        """Test sending a single product item to Concierge"""
        response = requests.post(
            f"{BASE_URL}/api/mira/vault/send-to-concierge",
            json={
                "vault_type": "picks",
                "session_id": "test-session-single-item",
                "member_id": "test-member-123",
                "member_email": "test@example.com",
                "member_name": "Test User",
                "pet": {"name": "Mojo", "species": "dog"},
                "pillar": "feed",
                "data": {
                    "picked_items": [
                        {"name": "Premium Dog Treats", "price": 299, "id": "treat-001"}
                    ],
                    "shown_items": [
                        {"name": "Premium Dog Treats", "price": 299, "id": "treat-001"},
                        {"name": "Healthy Biscuits", "price": 199, "id": "treat-002"}
                    ],
                    "context": "treats for training",
                    "user_action": "sent_single_item"
                }
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify success
        assert data.get("success") == True
        
        # Verify notification and ticket created
        assert "notification_id" in data
        assert data["notification_id"].startswith("NOTIF-")
        
        # Verify confirmation message
        assert "message" in data
        
        print(f"✓ Single item sent to Concierge - Notification: {data['notification_id']}")
    
    def test_send_multiple_items_to_concierge(self):
        """Test sending multiple selected items to Concierge"""
        response = requests.post(
            f"{BASE_URL}/api/mira/vault/send-to-concierge",
            json={
                "vault_type": "picks",
                "session_id": "test-session-multiple",
                "member_id": "test-member-456",
                "member_email": "multi@example.com",
                "pet": {"name": "Luna", "species": "dog"},
                "pillar": "shop",
                "data": {
                    "picked_items": [
                        {"name": "Product 1", "price": 100, "id": "p1"},
                        {"name": "Product 2", "price": 200, "id": "p2"},
                        {"name": "Product 3", "price": 300, "id": "p3"}
                    ],
                    "shown_items": [
                        {"name": "Product 1", "price": 100, "id": "p1"},
                        {"name": "Product 2", "price": 200, "id": "p2"},
                        {"name": "Product 3", "price": 300, "id": "p3"},
                        {"name": "Product 4", "price": 400, "id": "p4"}
                    ],
                    "user_action": "sent_with_picks"
                }
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        
        print(f"✓ Multiple items ({3}) sent to Concierge successfully")
    
    def test_send_without_picks_to_concierge(self):
        """Test sending request without selecting any specific picks"""
        response = requests.post(
            f"{BASE_URL}/api/mira/vault/send-to-concierge",
            json={
                "vault_type": "picks",
                "session_id": "test-session-no-picks",
                "member_id": "test-member-789",
                "member_email": "nopicks@example.com",
                "pet": {"name": "Buddy", "species": "dog"},
                "pillar": "care",
                "data": {
                    "picked_items": [],  # No items selected
                    "shown_items": [
                        {"name": "Product A", "price": 500, "id": "pa"}
                    ],
                    "user_action": "sent_without_picks"
                }
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data.get("success") == True
        
        print(f"✓ Request without picks sent to Concierge successfully")
    
    def test_vault_response_structure(self):
        """Test that vault send response has correct structure"""
        response = requests.post(
            f"{BASE_URL}/api/mira/vault/send-to-concierge",
            json={
                "vault_type": "picks",
                "session_id": "test-structure",
                "member_id": "structure-test",
                "member_email": "struct@test.com",
                "pet": {"name": "Test Pet"},
                "pillar": "feed",
                "data": {"picked_items": [{"name": "Test"}]}
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Verify all expected fields present
        assert "success" in data
        assert "vault_type" in data
        assert "notification_id" in data
        assert "inbox_id" in data
        assert "message" in data
        
        # Verify vault_type matches
        assert data["vault_type"] == "picks"
        
        print(f"✓ Vault response structure verified: {list(data.keys())}")


class TestPicksVaultIntegration:
    """Integration tests for the complete picks vault flow"""
    
    def test_full_refresh_and_send_flow(self):
        """Test the complete flow: Get picks -> Refresh -> Send to Concierge"""
        
        # Step 1: Get initial picks
        response1 = requests.post(
            f"{BASE_URL}/api/mira/refresh-picks",
            json={
                "pillar": "feed",
                "pet_context": {"name": "Mojo", "species": "dog"},
                "exclude_ids": [],
                "context": "healthy treats"
            }
        )
        assert response1.status_code == 200
        initial_picks = response1.json()["picks"]
        print(f"Step 1: Got {len(initial_picks)} initial picks")
        
        # Step 2: Refresh to get different options
        exclude_ids = [p["id"] for p in initial_picks if p.get("id")]
        response2 = requests.post(
            f"{BASE_URL}/api/mira/refresh-picks",
            json={
                "pillar": "feed",
                "pet_context": {"name": "Mojo", "species": "dog"},
                "exclude_ids": exclude_ids,
                "context": "healthy treats"
            }
        )
        assert response2.status_code == 200
        new_picks = response2.json()["picks"]
        print(f"Step 2: Refreshed, got {len(new_picks)} new picks")
        
        # Verify picks are different
        new_ids = set(p["id"] for p in new_picks if p.get("id"))
        old_ids = set(exclude_ids)
        overlap = new_ids & old_ids
        assert len(overlap) == 0, f"Overlapping IDs found: {overlap}"
        
        # Step 3: Send selected item to Concierge
        if new_picks:
            response3 = requests.post(
                f"{BASE_URL}/api/mira/vault/send-to-concierge",
                json={
                    "vault_type": "picks",
                    "session_id": "test-full-flow",
                    "member_email": "flow@test.com",
                    "pet": {"name": "Mojo"},
                    "pillar": "feed",
                    "data": {
                        "picked_items": [new_picks[0]],
                        "shown_items": new_picks,
                        "user_action": "sent_single_item"
                    }
                }
            )
            assert response3.status_code == 200
            assert response3.json()["success"] == True
            print(f"Step 3: Sent item '{new_picks[0]['name']}' to Concierge")
        
        print("✓ Full picks vault flow completed successfully")
    
    def test_refresh_count_decrement(self):
        """Test that refresh can be called multiple times (simulating count decrement)"""
        exclude_ids = []
        
        for i in range(3):  # maxRefreshes = 3 in frontend
            response = requests.post(
                f"{BASE_URL}/api/mira/refresh-picks",
                json={
                    "pillar": "shop",
                    "pet_context": {"name": "Test Pet", "species": "dog"},
                    "exclude_ids": exclude_ids,
                    "context": "dog supplies"
                }
            )
            assert response.status_code == 200
            picks = response.json()["picks"]
            
            # Add new IDs to exclude for next iteration
            new_ids = [p["id"] for p in picks if p.get("id")]
            exclude_ids.extend(new_ids)
            
            print(f"Refresh {i+1}/3: Got {len(picks)} picks, total excluded: {len(exclude_ids)}")
        
        print("✓ Multiple refreshes (3) completed successfully - simulates count decrement")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
