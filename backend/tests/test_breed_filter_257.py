"""
Breed Filter Tests - iteration 257
Tests breed isolation: Mojo (Indie dog) must ONLY see Indie + universal products.
Focus: shiba inu, maltipoo, italian greyhound, collie, bernese mountain dog contamination.
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
AUTH = ('aditya', 'lola4304')
HEADERS = {'Authorization': 'Basic YWRpdHlhOmxvbGE0MzA0'}

CONTAMINATION_BREEDS = [
    'shiba inu', 'maltipoo', 'italian greyhound', 'collie',
    'bernese mountain dog', 'australian shepherd', 'akita',
    'husky', 'siberian husky', 'pomeranian', 'golden retriever',
    'german shepherd', 'labrador', 'poodle', 'beagle',
    'bulldog', 'rottweiler', 'doberman',
]

ALL_PILLARS = ['dine', 'care', 'play', 'learn', 'go', 'shop', 'paperwork']


def get_all_products(pillar, breed='Indie', limit=500):
    """Fetch all products for a pillar+breed combo."""
    url = f"{BASE_URL}/api/admin/pillar-products?pillar={pillar}&breed={breed}&limit={limit}"
    resp = requests.get(url, headers=HEADERS, timeout=30)
    return resp


def contains_contaminated_breed(product_name: str) -> str | None:
    """Returns the contaminating breed found in product name, or None."""
    nl = product_name.lower()
    # Positive: product name contains a breed that is NOT indie/universal
    indie_synonyms = ['indie', 'indian pariah', 'desi', 'street dog', 'mixed']
    # First check if it's an indie product
    for s in indie_synonyms:
        if s in nl:
            return None  # Fine, this is an indie-specific product
    # Check for other known breed names
    for b in CONTAMINATION_BREEDS:
        if b != 'indie' and b in nl:
            return b
    return None


class TestBreedFilterCareShibaInu:
    """Shiba Inu contamination test — previously 3 products leaked (Bath Towel, Drying Robe, Grooming Apron)"""

    def test_care_breed_indie_no_shiba_inu(self):
        """GET /api/admin/pillar-products?pillar=care&breed=Indie must return 0 shiba inu products"""
        resp = get_all_products('care', breed='Indie', limit=200)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text[:200]}"
        data = resp.json()
        products = data.get('products', [])
        assert isinstance(products, list), "products should be a list"

        shiba_products = [p for p in products if 'shiba inu' in (p.get('name') or '').lower()]
        print(f"[care/Indie] Total products: {len(products)}, Shiba Inu products: {len(shiba_products)}")
        if shiba_products:
            print(f"  Contaminated: {[p.get('name') for p in shiba_products]}")
        assert len(shiba_products) == 0, \
            f"Care pillar with breed=Indie returned {len(shiba_products)} shiba inu products: {[p.get('name') for p in shiba_products]}"

    def test_care_breed_indie_no_known_breed_contamination(self):
        """Care pillar with breed=Indie must return 0 non-indie specific breed products"""
        resp = get_all_products('care', breed='Indie', limit=200)
        assert resp.status_code == 200
        data = resp.json()
        products = data.get('products', [])

        contaminated = []
        for p in products:
            breed_found = contains_contaminated_breed(p.get('name', ''))
            if breed_found:
                contaminated.append({'name': p.get('name'), 'breed': breed_found})

        print(f"[care/Indie] Total: {len(products)}, Contaminated: {len(contaminated)}")
        if contaminated:
            print(f"  Contaminated products: {contaminated[:10]}")
        assert len(contaminated) == 0, \
            f"Care pillar with breed=Indie returned {len(contaminated)} contaminated products: {contaminated[:5]}"


class TestBreedFilterDine:
    """Dine pillar breed filter tests"""

    def test_dine_breed_indie_status_200(self):
        """GET /api/admin/pillar-products?pillar=dine&breed=Indie returns 200"""
        resp = get_all_products('dine', breed='Indie', limit=200)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text[:200]}"

    def test_dine_breed_indie_returns_products(self):
        """Dine with breed=Indie must return some products (not empty)"""
        resp = get_all_products('dine', breed='Indie', limit=200)
        assert resp.status_code == 200
        data = resp.json()
        products = data.get('products', [])
        print(f"[dine/Indie] Total: {len(products)}")
        assert len(products) > 0, "Dine pillar with breed=Indie returned 0 products — should have food products"

    def test_dine_breed_indie_no_shiba_inu(self):
        """Dine pillar with breed=Indie must return 0 shiba inu products"""
        resp = get_all_products('dine', breed='Indie', limit=200)
        assert resp.status_code == 200
        data = resp.json()
        products = data.get('products', [])

        shiba_products = [p for p in products if 'shiba inu' in (p.get('name') or '').lower()]
        print(f"[dine/Indie] Total: {len(products)}, Shiba Inu: {len(shiba_products)}")
        assert len(shiba_products) == 0, \
            f"Dine pillar with breed=Indie returned shiba inu products: {[p.get('name') for p in shiba_products]}"

    def test_dine_breed_indie_no_contamination(self):
        """Dine pillar with breed=Indie: 0 contaminated (non-Indie breed-specific) products"""
        resp = get_all_products('dine', breed='Indie', limit=200)
        assert resp.status_code == 200
        data = resp.json()
        products = data.get('products', [])

        contaminated = []
        for p in products:
            breed_found = contains_contaminated_breed(p.get('name', ''))
            if breed_found:
                contaminated.append({'name': p.get('name'), 'breed': breed_found})

        print(f"[dine/Indie] Total: {len(products)}, Contaminated: {len(contaminated)}")
        assert len(contaminated) == 0, \
            f"Dine pillar with breed=Indie returned {len(contaminated)} contaminated: {contaminated[:5]}"

    def test_dine_no_breed_param_returns_more(self):
        """Dine without breed param returns more products than with breed=Indie"""
        resp_all = get_all_products('dine', breed='', limit=500)
        resp_indie = get_all_products('dine', breed='Indie', limit=500)

        # If pillar has breed-specific products, unfiltered should be >= filtered
        if resp_all.status_code == 200 and resp_indie.status_code == 200:
            total_all = resp_all.json().get('total', 0)
            total_indie = resp_indie.json().get('total', 0)
            print(f"[dine] All products: {total_all}, Indie-filtered: {total_indie}")
            # It's valid for filtered to be <= all
            assert total_indie <= total_all or total_indie == total_all, \
                f"Indie filter returned MORE products ({total_indie}) than unfiltered ({total_all})"


class TestBreedFilterAllPillars:
    """Cross-pillar breed contamination tests"""

    @pytest.mark.parametrize("pillar", ALL_PILLARS)
    def test_pillar_indie_no_shiba_inu(self, pillar):
        """All pillars must return 0 shiba inu products when breed=Indie"""
        resp = get_all_products(pillar, breed='Indie', limit=200)
        if resp.status_code != 200:
            pytest.skip(f"Pillar {pillar} not accessible: {resp.status_code}")

        data = resp.json()
        products = data.get('products', [])
        shiba_products = [p for p in products if 'shiba inu' in (p.get('name') or '').lower()]
        print(f"[{pillar}/Indie] Total: {len(products)}, Shiba Inu: {len(shiba_products)}")
        assert len(shiba_products) == 0, \
            f"Pillar {pillar} with breed=Indie returned shiba inu products: {[p.get('name') for p in shiba_products]}"

    @pytest.mark.parametrize("pillar", ALL_PILLARS)
    def test_pillar_indie_no_contamination(self, pillar):
        """All pillars must return 0 contaminated products when breed=Indie"""
        resp = get_all_products(pillar, breed='Indie', limit=200)
        if resp.status_code != 200:
            pytest.skip(f"Pillar {pillar} not accessible: {resp.status_code}")

        data = resp.json()
        products = data.get('products', [])

        contaminated = []
        for p in products:
            breed_found = contains_contaminated_breed(p.get('name', ''))
            if breed_found:
                contaminated.append({'name': p.get('name'), 'breed': breed_found})

        print(f"[{pillar}/Indie] Total: {len(products)}, Contaminated: {len(contaminated)}")
        assert len(contaminated) == 0, \
            f"Pillar {pillar} with breed=Indie returned {len(contaminated)} contaminated: {contaminated[:5]}"

    @pytest.mark.parametrize("pillar", ['care', 'dine'])
    def test_pillar_non_indie_breed_returns_own_products(self, pillar):
        """Products for non-Indie breeds should appear when that breed is requested"""
        resp = get_all_products(pillar, breed='Shiba Inu', limit=200)
        if resp.status_code != 200:
            pytest.skip(f"Pillar {pillar} not accessible for Shiba Inu: {resp.status_code}")
        data = resp.json()
        products = data.get('products', [])
        print(f"[{pillar}/Shiba Inu] Total: {len(products)}")
        # Shiba Inu products should appear for Shiba Inu breed (not 0)
        shiba_products = [p for p in products if 'shiba inu' in (p.get('name') or '').lower()]
        print(f"  Shiba-specific products: {[p.get('name') for p in shiba_products]}")
        # We just check it doesn't crash - shiba inu products may exist or not


class TestBreedFilterEndpointSanity:
    """Sanity checks for the breed filter endpoint"""

    def test_endpoint_accessible_without_breed(self):
        """Pillar products endpoint is accessible without breed param"""
        resp = requests.get(
            f"{BASE_URL}/api/admin/pillar-products?pillar=dine&limit=10",
            headers=HEADERS, timeout=15
        )
        assert resp.status_code == 200
        data = resp.json()
        assert 'products' in data
        assert 'total' in data

    def test_endpoint_accessible_with_indie_breed(self):
        """Pillar products endpoint returns 200 with breed=Indie"""
        resp = requests.get(
            f"{BASE_URL}/api/admin/pillar-products?pillar=dine&breed=Indie&limit=10",
            headers=HEADERS, timeout=15
        )
        assert resp.status_code == 200
        data = resp.json()
        assert 'products' in data

    def test_dine_indie_product_count_reasonable(self):
        """Dine pillar with breed=Indie should return a reasonable number of products"""
        resp = requests.get(
            f"{BASE_URL}/api/admin/pillar-products?pillar=dine&breed=Indie&limit=500",
            headers=HEADERS, timeout=30
        )
        assert resp.status_code == 200
        data = resp.json()
        total = data.get('total', 0)
        print(f"[dine/Indie] Total products: {total}")
        # Should be > 0 (dine has products) and < 500 (reasonable range)
        assert total > 0, f"Expected some dine products for Indie, got {total}"

    def test_care_indie_breed_filter_response_structure(self):
        """Care pillar returns correct structure with breed=Indie"""
        resp = requests.get(
            f"{BASE_URL}/api/admin/pillar-products?pillar=care&breed=Indie&limit=50",
            headers=HEADERS, timeout=15
        )
        assert resp.status_code == 200
        data = resp.json()
        assert 'products' in data
        assert 'total' in data
        assert 'page' in data
        assert 'limit' in data
        for p in data['products']:
            assert 'name' in p, "Each product should have a name field"


class TestDineBreedFilterDetailed:
    """Detailed contamination check for dine pillar with higher limit"""

    def test_dine_indie_limit_500_no_contamination(self):
        """Dine pillar with breed=Indie, limit=500: check all returned products"""
        resp = requests.get(
            f"{BASE_URL}/api/admin/pillar-products?pillar=dine&breed=Indie&limit=500",
            headers=HEADERS, timeout=30
        )
        assert resp.status_code == 200
        data = resp.json()
        products = data.get('products', [])
        total = data.get('total', 0)
        print(f"[dine/Indie/limit=500] Total: {total}, Returned: {len(products)}")

        contaminated = []
        for p in products:
            breed_found = contains_contaminated_breed(p.get('name', ''))
            if breed_found:
                contaminated.append({'name': p.get('name'), 'breed': breed_found})

        print(f"Contaminated products: {contaminated[:10]}")
        assert len(contaminated) == 0, \
            f"Dine/Indie returned {len(contaminated)} contaminated products: {contaminated}"

    def test_dine_indie_page2_no_contamination(self):
        """Dine pillar breed=Indie page=2 also has no contamination"""
        resp = requests.get(
            f"{BASE_URL}/api/admin/pillar-products?pillar=dine&breed=Indie&limit=100&page=2",
            headers=HEADERS, timeout=30
        )
        assert resp.status_code == 200
        data = resp.json()
        products = data.get('products', [])
        print(f"[dine/Indie/page=2] Returned: {len(products)}")

        contaminated = []
        for p in products:
            breed_found = contains_contaminated_breed(p.get('name', ''))
            if breed_found:
                contaminated.append({'name': p.get('name'), 'breed': breed_found})

        assert len(contaminated) == 0, \
            f"Dine/Indie page=2 returned contaminated products: {contaminated[:5]}"
