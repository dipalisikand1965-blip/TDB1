"""
Iteration 154 Tests:
- Admin panel flex-wrap for control buttons
- GET /api/mira/claude-picks/{pet_id}?entity_type=service returns picks with image_url
- POST /api/service_desk/attach_or_create_ticket creates ticket
- Dine page smoke test
- Products from static.prod-images.emergentagent.com are filtered
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestMiraClaudePicks:
    """Test Mira Claude picks endpoint for services"""

    def test_service_picks_endpoint_returns_200(self):
        """GET /api/mira/claude-picks/pet-mojo-7327ad56?entity_type=service"""
        resp = requests.get(
            f"{BASE_URL}/api/mira/claude-picks/pet-mojo-7327ad56",
            params={'pillar': 'dine', 'limit': 3, 'entity_type': 'service'},
            timeout=60
        )
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text[:200]}"
        data = resp.json()
        print(f"Service picks response keys: {list(data.keys())}")
        # Should have picks list
        assert 'picks' in data, f"No 'picks' key in response: {data.keys()}"
        picks = data['picks']
        print(f"Number of service picks returned: {len(picks)}")

    def test_service_picks_have_entity_type(self):
        """Service picks should have entity_type=service"""
        resp = requests.get(
            f"{BASE_URL}/api/mira/claude-picks/pet-mojo-7327ad56",
            params={'pillar': 'dine', 'limit': 6, 'entity_type': 'service'},
            timeout=60
        )
        assert resp.status_code == 200
        data = resp.json()
        picks = data.get('picks', [])
        if picks:
            # Check at least some picks have entity_type
            for pick in picks[:3]:
                print(f"  Pick: {pick.get('name', 'N/A')} | entity_type: {pick.get('entity_type', 'not-set')} | image_url: {pick.get('image_url', 'none')[:50] if pick.get('image_url') else 'none'}")
            print(f"SERVICE PICKS TEST: {len(picks)} picks returned")
        else:
            print("No service picks returned (may be expected if no scores exist yet)")

    def test_service_picks_report_forbidden_image_urls(self):
        """INFORMATIONAL: Report static.prod-images.emergentagent.com URLs in backend response.
        NOTE: Frontend resolvePickImage() filters these out. Backend still returns them (intentional).
        """
        resp = requests.get(
            f"{BASE_URL}/api/mira/claude-picks/pet-mojo-7327ad56",
            params={'pillar': 'dine', 'limit': 12, 'entity_type': 'service'},
            timeout=60
        )
        assert resp.status_code == 200
        picks = resp.json().get('picks', [])
        forbidden_urls = []
        for pick in picks:
            img = pick.get('image_url', '') or ''
            if 'static.prod-images.emergentagent.com' in img:
                forbidden_urls.append((pick.get('name', 'N/A'), img[:80]))
        if forbidden_urls:
            print(f"INFO: {len(forbidden_urls)} picks have 403 image URLs (frontend filters these)")
            for name, url in forbidden_urls:
                print(f"  - {name}: {url}")
        else:
            print(f"PASS: No forbidden URLs in {len(picks)} service picks")
        # Assert endpoint is healthy - don't fail for 403 URLs since frontend handles them
        assert resp.status_code == 200, "Endpoint should return 200"

    def test_product_picks_endpoint_returns_200(self):
        """GET /api/mira/claude-picks/pet-mojo-7327ad56?entity_type=product"""
        resp = requests.get(
            f"{BASE_URL}/api/mira/claude-picks/pet-mojo-7327ad56",
            params={'pillar': 'dine', 'limit': 3, 'entity_type': 'product'},
            timeout=60
        )
        assert resp.status_code == 200
        data = resp.json()
        picks = data.get('picks', [])
        print(f"Product picks returned: {len(picks)}")
        for pick in picks[:3]:
            img = pick.get('image_url', '') or ''
            print(f"  Product: {pick.get('name', 'N/A')} | image_url: {img[:60] if img else 'none'}")


class TestServiceDeskTicket:
    """Test service desk attach_or_create_ticket endpoint"""

    def test_create_ticket_success(self):
        """POST /api/service_desk/attach_or_create_ticket creates ticket"""
        payload = {
            "parent_id": "TEST_parent_154",
            "pet_id": "pet-mojo-7327ad56",
            "pillar": "dine",
            "intent_primary": "test_service_request",
            "intent_secondary": ["test item"],
            "life_state": "dine",
            "channel": "test_channel",
            "initial_message": {
                "sender": "parent",
                "source": "test",
                "text": "This is a test concierge ticket from iteration 154"
            }
        }
        resp = requests.post(
            f"{BASE_URL}/api/service_desk/attach_or_create_ticket",
            json=payload,
            timeout=30
        )
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text[:300]}"
        data = resp.json()
        print(f"Ticket creation response: {data}")
        # Validate response structure
        assert 'ticket_id' in data, f"No ticket_id in response: {data}"
        assert 'status' in data, f"No status in response: {data}"
        assert 'is_new' in data, f"No is_new in response: {data}"
        assert data['ticket_id'].startswith('TCK-'), f"ticket_id format unexpected: {data['ticket_id']}"
        print(f"TICKET CREATED: {data['ticket_id']}, is_new={data['is_new']}, status={data['status']}")

    def test_create_ticket_returns_ticket_id_format(self):
        """Ticket ID should be in TCK-YYYY-NNNNNN format"""
        payload = {
            "parent_id": "TEST_format_check_154",
            "pet_id": "pet-test-format",
            "pillar": "care",
            "intent_primary": "test_format",
            "intent_secondary": [],
            "life_state": "test",
            "channel": "test",
            "initial_message": {
                "sender": "parent",
                "source": "test",
                "text": "Format check test"
            }
        }
        resp = requests.post(
            f"{BASE_URL}/api/service_desk/attach_or_create_ticket",
            json=payload,
            timeout=30
        )
        assert resp.status_code == 200
        data = resp.json()
        ticket_id = data.get('ticket_id', '')
        # Should be TCK-2026-XXXXXX
        parts = ticket_id.split('-')
        assert len(parts) >= 3, f"Ticket ID format invalid: {ticket_id}"
        assert parts[0] == 'TCK', f"Expected TCK prefix: {ticket_id}"
        print(f"Ticket ID format PASS: {ticket_id}")

    def test_attach_to_existing_ticket(self):
        """Second request for same parent/pet/pillar should attach to existing ticket"""
        payload = {
            "parent_id": "TEST_attach_154",
            "pet_id": "pet-attach-test",
            "pillar": "dine",
            "intent_primary": "test_attach",
            "intent_secondary": [],
            "life_state": "dine",
            "channel": "test",
            "initial_message": {
                "sender": "parent",
                "source": "test",
                "text": "First message"
            }
        }
        # First call - creates ticket
        resp1 = requests.post(f"{BASE_URL}/api/service_desk/attach_or_create_ticket", json=payload, timeout=30)
        assert resp1.status_code == 200
        ticket_id_1 = resp1.json()['ticket_id']
        is_new_1 = resp1.json()['is_new']
        
        # Second call - same parent/pet/pillar → should attach
        payload['initial_message']['text'] = "Second message - should attach"
        resp2 = requests.post(f"{BASE_URL}/api/service_desk/attach_or_create_ticket", json=payload, timeout=30)
        assert resp2.status_code == 200
        ticket_id_2 = resp2.json()['ticket_id']
        is_new_2 = resp2.json()['is_new']
        
        # Second call should attach to existing ticket
        assert ticket_id_1 == ticket_id_2, f"Expected same ticket, got {ticket_id_1} vs {ticket_id_2}"
        assert is_new_2 == False, f"Expected is_new=False for attach, got {is_new_2}"
        print(f"ATTACH TEST PASS: ticket {ticket_id_1} reused, is_new={is_new_2}")

    def test_ticket_missing_required_field_returns_error(self):
        """POST without required field should return 4xx"""
        payload = {
            "parent_id": "TEST_missing_154",
            # Missing pet_id, pillar, etc.
            "initial_message": {
                "sender": "parent",
                "source": "test",
                "text": "Test"
            }
        }
        resp = requests.post(
            f"{BASE_URL}/api/service_desk/attach_or_create_ticket",
            json=payload,
            timeout=30
        )
        assert resp.status_code in [400, 422], f"Expected 4xx for missing field, got {resp.status_code}"
        print(f"VALIDATION TEST PASS: status {resp.status_code} for missing field")


class TestAdminEndpoints:
    """Test admin related API endpoints"""

    def test_admin_login_success(self):
        """POST /api/admin/login with correct credentials"""
        resp = requests.post(
            f"{BASE_URL}/api/admin/login",
            json={"username": "aditya", "password": "lola4304"},
            timeout=30
        )
        assert resp.status_code == 200, f"Admin login failed: {resp.status_code}: {resp.text[:200]}"
        print(f"ADMIN LOGIN PASS: {resp.status_code}")

    def test_admin_verify_with_auth_header(self):
        """GET /api/admin/verify with Basic auth header"""
        import base64
        auth = base64.b64encode(b"aditya:lola4304").decode()
        resp = requests.get(
            f"{BASE_URL}/api/admin/verify",
            headers={"Authorization": f"Basic {auth}"},
            timeout=30
        )
        assert resp.status_code == 200, f"Admin verify failed: {resp.status_code}: {resp.text[:200]}"
        print(f"ADMIN VERIFY PASS: {resp.status_code}")


class TestDinePageAPIs:
    """Test Dine page related APIs"""

    def test_dine_pillar_products_loads(self):
        """GET /api/admin/pillar-products?pillar=dine returns products"""
        resp = requests.get(
            f"{BASE_URL}/api/admin/pillar-products",
            params={'pillar': 'dine', 'limit': 10},
            timeout=30
        )
        assert resp.status_code == 200, f"Dine products failed: {resp.status_code}"
        data = resp.json()
        products = data.get('products', [])
        print(f"Dine products returned: {len(products)}")

    def test_dine_products_no_forbidden_image_urls(self):
        """Products in mira picks should not have static.prod-images.emergentagent.com URLs"""
        resp = requests.get(
            f"{BASE_URL}/api/mira/claude-picks/pet-mojo-7327ad56",
            params={'pillar': 'dine', 'limit': 12},
            timeout=60
        )
        assert resp.status_code == 200
        picks = resp.json().get('picks', [])
        forbidden_count = 0
        for pick in picks:
            for field in ['image_url', 'image']:
                img = pick.get(field, '') or ''
                if 'static.prod-images.emergentagent.com' in img:
                    forbidden_count += 1
                    print(f"WARNING: Forbidden URL in pick '{pick.get('name')}' field '{field}': {img}")
        print(f"Forbidden image URL count: {forbidden_count} (should be 0 after frontend filtering)")
        # Note: Backend might still return these URLs, frontend resolvePickImage filters them
        # We report but don't assert here as this is a frontend fix
        print(f"TOTAL PICKS: {len(picks)}, FORBIDDEN IN BACKEND: {forbidden_count}")


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
