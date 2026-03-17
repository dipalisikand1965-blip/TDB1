"""
Backend tests for Go Pillar features:
- Category pills (soul+mira)
- Products API (stay sub-category)
- Services API (8 services)
- Mira claude-picks (soul go + mira's picks)
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


@pytest.fixture(scope="module")
def auth_token():
    """Get auth token for dipali (main test user)"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": "dipali@clubconcierge.in",
        "password": "test123"
    })
    if response.status_code == 200:
        return response.json().get("access_token")
    pytest.skip(f"Auth failed: {response.text}")


@pytest.fixture(scope="module")
def pet_id(auth_token):
    """Get first pet ID for test user"""
    resp = requests.get(f"{BASE_URL}/api/pets", headers={"Authorization": f"Bearer {auth_token}"})
    if resp.status_code == 200:
        data = resp.json()
        pets = data if isinstance(data, list) else data.get('pets', [])
        if pets:
            return pets[0].get('id')
    pytest.skip("No pets found")


class TestServicesAPI:
    """Test /api/service-box/services?pillar=go returns 8 services in 2 categories"""

    def test_services_returns_8(self):
        """Should return exactly 8 services for go pillar"""
        resp = requests.get(f"{BASE_URL}/api/service-box/services?pillar=go")
        assert resp.status_code == 200
        data = resp.json()
        services = data.get('services', [])
        assert len(services) == 8, f"Expected 8 services, got {len(services)}: {[s.get('name') for s in services]}"

    def test_services_has_travel_category(self):
        """Should have 6 travel services"""
        resp = requests.get(f"{BASE_URL}/api/service-box/services?pillar=go")
        assert resp.status_code == 200
        services = resp.json().get('services', [])
        travel = [s for s in services if s.get('category') == 'travel' or s.get('sub_pillar') == 'travel']
        assert len(travel) == 6, f"Expected 6 travel services, got {len(travel)}: {[s.get('name') for s in travel]}"

    def test_services_has_stay_category(self):
        """Should have 2 stay services"""
        resp = requests.get(f"{BASE_URL}/api/service-box/services?pillar=go")
        assert resp.status_code == 200
        services = resp.json().get('services', [])
        stay = [s for s in services if s.get('category') == 'stay' or s.get('sub_pillar') == 'stay']
        assert len(stay) == 2, f"Expected 2 stay services, got {len(stay)}: {[s.get('name') for s in stay]}"

    def test_services_has_expected_travel_names(self):
        """Travel section should have flight, road, taxi, planning, relocation, emergency"""
        resp = requests.get(f"{BASE_URL}/api/service-box/services?pillar=go")
        assert resp.status_code == 200
        services = resp.json().get('services', [])
        names = [s.get('name', '').lower() for s in services]
        assert any('flight' in n for n in names), "Missing Flight service"
        assert any('road' in n or 'train' in n for n in names), "Missing Road/Train service"
        assert any('taxi' in n for n in names), "Missing Pet Taxi service"
        assert any('planning' in n for n in names), "Missing Travel Planning service"
        assert any('relocation' in n for n in names), "Missing Relocation service"
        assert any('emergency' in n for n in names), "Missing Emergency Travel service"

    def test_services_has_expected_stay_names(self):
        """Stay section should have boarding/daycare and pet sitting"""
        resp = requests.get(f"{BASE_URL}/api/service-box/services?pillar=go")
        assert resp.status_code == 200
        services = resp.json().get('services', [])
        names = [s.get('name', '').lower() for s in services]
        assert any('board' in n or 'daycare' in n for n in names), "Missing Boarding/Daycare service"
        assert any('sitting' in n or 'sitter' in n for n in names), "Missing Pet Sitting service"

    def test_services_structure(self):
        """Each service should have required fields"""
        resp = requests.get(f"{BASE_URL}/api/service-box/services?pillar=go")
        assert resp.status_code == 200
        services = resp.json().get('services', [])
        for svc in services:
            assert 'id' in svc, f"Service missing id: {svc.get('name')}"
            assert 'name' in svc, f"Service missing name"
            assert 'category' in svc or 'sub_pillar' in svc, f"Service missing category/sub_pillar: {svc.get('name')}"


class TestProductsAPI:
    """Test /api/admin/pillar-products?pillar=go returns products"""

    def test_products_endpoint_works(self):
        """Products API should return successfully"""
        resp = requests.get(f"{BASE_URL}/api/admin/pillar-products?pillar=go&limit=100")
        assert resp.status_code == 200
        data = resp.json()
        prods = data.get('products', [])
        assert len(prods) > 0, "No products returned"

    def test_products_has_stay_subcategory(self):
        """Should have stay sub-category products (21 new ones seeded)"""
        resp = requests.get(f"{BASE_URL}/api/admin/pillar-products?pillar=go&limit=500")
        assert resp.status_code == 200
        data = resp.json()
        prods = data.get('products', data if isinstance(data, list) else [])
        # Count stay-related products
        stay_prods = [p for p in prods if 
                      any(kw in (p.get('category','') + p.get('sub_category','')).lower() 
                          for kw in ['stay', 'boarding', 'daycare', 'sitting', 'board'])]
        assert len(stay_prods) >= 21, f"Expected at least 21 stay sub-cat products, got {len(stay_prods)}"

    def test_products_has_travel_products(self):
        """Should have travel products (31 travel products)"""
        resp = requests.get(f"{BASE_URL}/api/admin/pillar-products?pillar=go&limit=500")
        assert resp.status_code == 200
        data = resp.json()
        prods = data.get('products', data if isinstance(data, list) else [])
        travel_prods = [p for p in prods if 
                        any(kw in (p.get('category','')).lower() 
                            for kw in ['travel', 'safety', 'calming', 'carrier', 'feeding', 'health'])]
        assert len(travel_prods) >= 20, f"Expected at least 20 travel products, got {len(travel_prods)}"

    def test_products_total_count(self):
        """Total go products should be 52+ (31 travel + 21 stay)"""
        resp = requests.get(f"{BASE_URL}/api/admin/pillar-products?pillar=go&limit=500")
        assert resp.status_code == 200
        data = resp.json()
        total = data.get('total', len(data.get('products', [])))
        assert total >= 52, f"Expected total >= 52, got {total}"


class TestMiraPicksAPI:
    """Test Mira AI-picks for Soul Go + Mira's Picks pills"""

    def test_soul_go_picks(self, pet_id, auth_token):
        """Soul Go pill: mira/claude-picks should return products for go pillar"""
        resp = requests.get(
            f"{BASE_URL}/api/mira/claude-picks/{pet_id}?pillar=go&limit=16&min_score=60&entity_type=product",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert resp.status_code == 200
        data = resp.json()
        picks = data.get('picks', [])
        assert len(picks) > 0, "Soul Go should return at least some picks"
        # Verify structure
        for pick in picks[:3]:
            assert 'name' in pick or 'entity_name' in pick, f"Pick missing name: {pick}"
            assert 'mira_score' in pick, f"Pick missing score: {pick.get('name')}"

    def test_mira_picks_products(self, pet_id, auth_token):
        """Mira's Picks pill: should return products"""
        resp = requests.get(
            f"{BASE_URL}/api/mira/claude-picks/{pet_id}?pillar=go&limit=12&min_score=60&entity_type=product",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert resp.status_code == 200
        picks = resp.json().get('picks', [])
        assert len(picks) > 0, "Mira picks should return products"

    def test_mira_picks_services(self, pet_id, auth_token):
        """Mira's Picks pill: should return services"""
        resp = requests.get(
            f"{BASE_URL}/api/mira/claude-picks/{pet_id}?pillar=go&limit=6&min_score=60&entity_type=service",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert resp.status_code == 200
        # May return picks or empty if no services yet scored
        data = resp.json()
        assert 'picks' in data, "Should have picks key in response"
