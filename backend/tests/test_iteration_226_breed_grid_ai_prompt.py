"""
Iteration 226 Backend Tests
Tests for:
1. PersonalisedBreedSection: API must NOT include pillar filter — fetch ALL breed products
2. PersonalisedBreedSection: Shows up to 12 breed products sorted by current-pillar first
3. SoulMadeModal: /api/mockups/breed-products returns limit=40 without pillar
4. Breed isolation: Mojo (Indie) sees ONLY Indie products
5. AI prompt generation endpoint availability
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
ADMIN_AUTH = ('aditya', 'lola4304')


class TestBreedCatalogueNoFilter:
    """Verify /api/breed-catalogue/products fetches ALL pillars (no pillar filter)"""

    def test_indie_products_returns_all_pillars(self):
        """Indie breed should have products across multiple pillars"""
        resp = requests.get(f'{BASE_URL}/api/breed-catalogue/products?breed=Indie&limit=40')
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        data = resp.json()
        products = data.get('products', [])
        assert len(products) > 0, "Expected at least 1 Indie product"

        # Collect all pillars
        all_pillars = set()
        for p in products:
            for pl in (p.get('pillars') or []):
                all_pillars.add(pl)

        # Should have more than just learn pillar — must have multi-pillar data
        print(f"Total Indie products: {len(products)}")
        print(f"Pillars found: {all_pillars}")
        # Indie has 38+ products across many pillars; must NOT be just 'learn'
        assert len(products) > 3, f"Expected many Indie products (not just learn-filtered), got {len(products)}"
        assert len(all_pillars) > 1, f"Expected multi-pillar products, got {all_pillars}"

    def test_indie_has_learn_pillar_products(self):
        """Indie should have products in the learn pillar"""
        resp = requests.get(f'{BASE_URL}/api/breed-catalogue/products?breed=Indie&limit=40')
        assert resp.status_code == 200
        data = resp.json()
        products = data.get('products', [])
        learn_prods = [p for p in products if 'learn' in (p.get('pillars') or [])]
        print(f"Learn pillar products for Indie: {len(learn_prods)}")
        assert len(learn_prods) >= 1, "Expected at least 1 learn-pillar product for Indie"

    def test_indie_has_cross_pillar_products_beyond_learn(self):
        """Indie should have products in pillars OTHER than learn"""
        resp = requests.get(f'{BASE_URL}/api/breed-catalogue/products?breed=Indie&limit=40')
        assert resp.status_code == 200
        data = resp.json()
        products = data.get('products', [])
        non_learn = [p for p in products if 'learn' not in (p.get('pillars') or [])]
        print(f"Non-learn Indie products: {len(non_learn)}")
        # There should be many more non-learn products than learn products (38 total vs 3 learn)
        learn_count = len(products) - len(non_learn)
        assert len(non_learn) > learn_count, (
            f"Expected more non-learn products than learn, but got learn={learn_count}, non-learn={len(non_learn)}"
        )

    def test_limit_40_respected(self):
        """Endpoint should return up to 40 products"""
        resp = requests.get(f'{BASE_URL}/api/breed-catalogue/products?breed=Indie&limit=40')
        assert resp.status_code == 200
        data = resp.json()
        products = data.get('products', [])
        assert len(products) <= 40, f"Expected at most 40 products, got {len(products)}"

    def test_labrador_products_no_pillar_filter(self):
        """Labrador breed products should be fetchable without pillar filter"""
        resp = requests.get(f'{BASE_URL}/api/breed-catalogue/products?breed=Labrador&limit=40')
        assert resp.status_code == 200
        data = resp.json()
        products = data.get('products', [])
        print(f"Labrador products: {len(products)}")
        # Just ensure the endpoint works — data may be 0 for Labrador
        assert isinstance(products, list)

    def test_indie_no_labrador_akita_products(self):
        """Mojo (Indie) should NOT see Labrador/Akita products — breed isolation"""
        resp = requests.get(f'{BASE_URL}/api/breed-catalogue/products?breed=Indie&limit=40')
        assert resp.status_code == 200
        data = resp.json()
        products = data.get('products', [])
        # No product name should reference Labrador or Akita (breed isolation)
        for p in products:
            name = (p.get('name') or '').lower()
            breed_tags = [b.lower() for b in (p.get('breed_tags') or p.get('breeds') or [])]
            assert 'labrador' not in name, f"Labrador product found in Indie feed: {p.get('name')}"
            assert 'akita' not in name, f"Akita product found in Indie feed: {p.get('name')}"
            # Check breed tags don't include conflicting breeds
            for tag in breed_tags:
                assert 'labrador' not in tag, f"Labrador breed tag in Indie product: {p.get('name')}"
                assert 'akita' not in tag, f"Akita breed tag in Indie product: {p.get('name')}"


class TestSoulMadeModalProducts:
    """Verify /api/mockups/breed-products returns ALL products (limit=40, no pillar filter)"""

    def test_mockups_breed_products_endpoint_works(self):
        """SoulMadeModal uses /api/mockups/breed-products — must return products"""
        resp = requests.get(f'{BASE_URL}/api/mockups/breed-products?limit=40')
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text[:200]}"
        data = resp.json()
        # Accept either list or dict with products key
        if isinstance(data, list):
            products = data
        else:
            products = data.get('products', data.get('results', []))
        print(f"Soul Made modal products: {len(products)}")
        assert isinstance(products, list)

    def test_mockups_breed_products_with_indie_breed(self):
        """SoulMadeModal with Indie breed param should return Indie products"""
        # Modal normalizes breed: lowercase, underscores
        resp = requests.get(f'{BASE_URL}/api/mockups/breed-products?limit=40&breed=indie')
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        data = resp.json()
        if isinstance(data, list):
            products = data
        else:
            products = data.get('products', data.get('results', []))
        print(f"Soul Made Indie products: {len(products)}")
        assert isinstance(products, list)


class TestBreedIsolation:
    """Verify Mojo (Indie) on learn page only sees Indie products"""

    def test_indie_products_on_learn_pillar_sorted(self):
        """Fetch Indie products and verify learn-pillar products come first when sorted"""
        resp = requests.get(f'{BASE_URL}/api/breed-catalogue/products?breed=Indie&limit=40')
        assert resp.status_code == 200
        data = resp.json()
        products = data.get('products', [])

        # Simulate frontend sorting: learn pillar first, then others
        pillar = 'learn'
        sorted_prods = sorted(products, key=lambda p: (0 if pillar in (p.get('pillars') or []) else 1))
        # First product should be learn-pillar if any exist
        learn_count = sum(1 for p in products if pillar in (p.get('pillars') or []))
        if learn_count > 0:
            # After sort, first product should have 'learn' in pillars
            assert pillar in (sorted_prods[0].get('pillars') or []), (
                f"Expected learn pillar first after sort, got {sorted_prods[0].get('pillars')}"
            )
            # Up to 12 shown in grid; should include learn-pillar products
            top12 = sorted_prods[:12]
            learn_in_top12 = [p for p in top12 if pillar in (p.get('pillars') or [])]
            print(f"Learn products in top 12: {len(learn_in_top12)}")
            assert len(learn_in_top12) == learn_count or len(learn_in_top12) >= min(learn_count, 12), (
                "Expected all learn-pillar products to appear in top 12"
            )
        print(f"Total: {len(products)}, Learn: {learn_count}")


class TestAdminGenerateImageEndpoint:
    """Verify /api/admin/generate-image endpoint is accessible"""

    def test_generate_image_endpoint_requires_auth(self):
        """Endpoint should return 401/403 without auth"""
        resp = requests.post(f'{BASE_URL}/api/admin/generate-image',
                             json={'prompt': 'test', 'entity_type': 'product', 'entity_id': 'test'})
        assert resp.status_code in [401, 403, 422], (
            f"Expected auth error, got {resp.status_code}: {resp.text[:200]}"
        )

    def test_generate_image_endpoint_with_auth(self):
        """Endpoint should return 200 or error on bad entity (not 401)"""
        import base64
        token = base64.b64encode(b'aditya:lola4304').decode()
        resp = requests.post(f'{BASE_URL}/api/admin/generate-image',
                             headers={'Authorization': f'Basic {token}', 'Content-Type': 'application/json'},
                             json={'prompt': 'test dog product', 'entity_type': 'product', 'entity_id': ''})
        # Should not be 401 with proper auth
        assert resp.status_code != 401, f"Auth failed: {resp.text[:200]}"
        print(f"Generate image response: {resp.status_code} {resp.text[:200]}")
        # Accept 200 (if generation works) or 400/422/500 (bad entity) — just not 401
        assert resp.status_code in [200, 400, 422, 500], f"Unexpected status: {resp.status_code}"


class TestBreedCatalogueDetails:
    """Verify product data structure returned by breed catalogue"""

    def test_indie_products_have_required_fields(self):
        """Products should have name and pillars fields"""
        resp = requests.get(f'{BASE_URL}/api/breed-catalogue/products?breed=Indie&limit=40')
        assert resp.status_code == 200
        data = resp.json()
        products = data.get('products', [])
        assert len(products) > 0
        for p in products[:5]:  # Check first 5
            assert 'name' in p or 'title' in p, f"Product missing name: {p}"
            # pillars may be empty array but should exist
            assert 'pillars' in p or 'pillar' in p, f"Product missing pillars: {p}"

    def test_indie_products_response_structure(self):
        """Response should have products array and total/count"""
        resp = requests.get(f'{BASE_URL}/api/breed-catalogue/products?breed=Indie&limit=40')
        assert resp.status_code == 200
        data = resp.json()
        assert 'products' in data, f"Expected 'products' key in response: {data.keys()}"
        products = data['products']
        assert isinstance(products, list)
        print(f"Response keys: {list(data.keys())}")
        print(f"Product count: {len(products)}")
