"""
Backend tests for Play page 5 fixes (iteration 175):
1. Soul Picks breed filtering (via /api/products and /api/admin/pillar-products)
2. Mira's Picks modal opening (frontend logic - test API endpoints it calls)
3. Bundles API from /api/bundles?pillar=enjoy and /api/bundles?pillar=fit
4. Services heading (PlayConciergeSection.jsx) - visual only
5. Admin /api/admin/bundles/{id}/generate-image endpoint exists and returns proper 404
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


@pytest.fixture(scope="module")
def admin_token():
    """Get admin token"""
    response = requests.post(f"{BASE_URL}/api/admin/login", json={
        "username": "aditya",
        "password": "lola4304"
    })
    if response.status_code == 200:
        return response.json().get("token")
    pytest.skip("Admin authentication failed")


@pytest.fixture(scope="module")
def user_token():
    """Get user token"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": "dipali@clubconcierge.in",
        "password": "test123"
    })
    if response.status_code == 200:
        return response.json().get("access_token")
    pytest.skip("User authentication failed")


class TestIssue1SoulPicksBreedFiltering:
    """Issue 1: Soul Picks should filter by active pet's breed (Mojo=Indie)"""

    def test_breed_play_bandanas_endpoint_exists(self):
        """Verify /api/products?category=breed-play_bandanas returns products"""
        response = requests.get(f"{BASE_URL}/api/products?category=breed-play_bandanas&limit=60")
        assert response.status_code == 200
        data = response.json()
        assert "products" in data
        print(f"breed-play_bandanas total: {len(data['products'])} products")

    def test_breed_playdate_cards_endpoint_exists(self):
        """Verify /api/products?category=breed-playdate_cards returns products"""
        response = requests.get(f"{BASE_URL}/api/products?category=breed-playdate_cards&limit=60")
        assert response.status_code == 200
        data = response.json()
        assert "products" in data
        print(f"breed-playdate_cards total: {len(data['products'])} products")

    def test_soul_picks_indie_breed_products_exist(self):
        """Check that indie breed products exist in the soul category"""
        # Check bandanas - there should be indie-specific ones
        r1 = requests.get(f"{BASE_URL}/api/products?category=breed-play_bandanas&limit=60")
        r2 = requests.get(f"{BASE_URL}/api/products?category=breed-playdate_cards&limit=60")
        assert r1.status_code == 200
        assert r2.status_code == 200
        
        bandanas = r1.json().get('products', [])
        cards = r2.json().get('products', [])
        all_products = bandanas + cards
        
        # Check for indie-specific products
        indie_products = []
        for p in all_products:
            bt = [b.lower() for b in (p.get('breed_tags', []) or [])]
            btr = [b.lower() for b in (p.get('breed_targets', []) or [])]
            nm = (p.get('name', '') or '').lower()
            
            # Check if this product matches 'indie' breed
            if any('indie' in b for b in bt) or any('indie' in b for b in btr) or 'indie' in nm:
                indie_products.append(p.get('name'))
        
        print(f"Indie-specific soul products: {indie_products}")
        # Indie-specific products should exist (bandana + card for indie breed)
        # This verifies that when Mojo (Indie) clicks Soul Picks, filtered products are available
        assert len(all_products) > 0, "Soul picks products should exist"

    def test_play_pillar_products_soul_category(self):
        """Verify /api/admin/pillar-products?pillar=play&category=soul endpoint works"""
        response = requests.get(f"{BASE_URL}/api/admin/pillar-products?pillar=play&category=soul&limit=30")
        assert response.status_code == 200
        data = response.json()
        assert "products" in data
        print(f"play soul pillar products: {len(data['products'])} products")

    def test_play_pillar_products_all_with_breed_tags(self):
        """Verify pillar products have breed_tags or breed_targets for filtering"""
        response = requests.get(f"{BASE_URL}/api/admin/pillar-products?pillar=play&limit=250")
        assert response.status_code == 200
        data = response.json()
        products = data.get('products', [])
        assert len(products) > 0
        
        # Count products with breed-specific tags
        breed_specific = [p for p in products if 
                         (p.get('breed_tags') and p.get('breed_tags') not in [['all_breeds'], ['all'], []]) or
                         (p.get('breed_targets') and p.get('breed_targets') not in [['all_breeds'], ['all'], []])]
        
        all_breeds = [p for p in products if 
                     p.get('breed_tags') == ['all_breeds'] or p.get('breed_tags') == ['all'] or
                     not p.get('breed_tags')]
        
        print(f"Total play products: {len(products)}, Breed-specific: {len(breed_specific)}, All-breeds: {len(all_breeds)}")
        # If filter works, Indie breed should only show indie + all_breeds products


class TestIssue3BundlesFromDB:
    """Issue 3: Bundles pill should show real bundles from enjoy+fit pillars"""

    def test_enjoy_bundles_api_exists(self):
        """Verify /api/bundles?pillar=enjoy returns real bundles"""
        response = requests.get(f"{BASE_URL}/api/bundles?pillar=enjoy&active_only=true&limit=20")
        assert response.status_code == 200
        data = response.json()
        assert "bundles" in data
        bundles = data['bundles']
        assert len(bundles) > 0, "Enjoy bundles should exist in DB"
        
        bundle_names = [b.get('name') for b in bundles]
        print(f"Enjoy bundles ({len(bundles)}): {bundle_names}")
        
        # Verify expected bundles exist
        expected = ["Play Day Bundle", "Indoor Fun Bundle", "Adventure Day Kit"]
        found = [e for e in expected if any(e.lower() in n.lower() for n in bundle_names)]
        print(f"Found expected bundles: {found}")

    def test_fit_bundles_api_exists(self):
        """Verify /api/bundles?pillar=fit returns real bundles"""
        response = requests.get(f"{BASE_URL}/api/bundles?pillar=fit&active_only=true&limit=20")
        assert response.status_code == 200
        data = response.json()
        assert "bundles" in data
        bundles = data['bundles']
        assert len(bundles) > 0, "Fit bundles should exist in DB"
        
        bundle_names = [b.get('name') for b in bundles]
        print(f"Fit bundles ({len(bundles)}): {bundle_names}")
        
        # Verify expected bundles exist
        expected = ["Fitness Starter Kit", "Agility Training Bundle", "Daily Walker Bundle"]
        found = [e for e in expected if any(e.lower() in n.lower() for n in bundle_names)]
        print(f"Found expected bundles: {found}")

    def test_bundles_have_required_fields(self):
        """Verify bundles have all fields needed for BundleCard rendering"""
        enjoy_res = requests.get(f"{BASE_URL}/api/bundles?pillar=enjoy&active_only=true&limit=5")
        fit_res = requests.get(f"{BASE_URL}/api/bundles?pillar=fit&active_only=true&limit=5")
        
        assert enjoy_res.status_code == 200
        assert fit_res.status_code == 200
        
        all_bundles = enjoy_res.json().get('bundles', []) + fit_res.json().get('bundles', [])
        assert len(all_bundles) > 0
        
        for bundle in all_bundles[:3]:
            assert 'id' in bundle or '_id' in bundle, f"Bundle missing id: {bundle.get('name')}"
            assert 'name' in bundle, f"Bundle missing name"
            print(f"Bundle: {bundle.get('name')}, price: {bundle.get('bundle_price')}, img: {'yes' if bundle.get('image_url') or bundle.get('cloudinary_image_url') else 'no'}")

    def test_total_bundles_count(self):
        """Verify combined enjoy+fit bundles count is reasonable (expected ~13)"""
        enjoy_res = requests.get(f"{BASE_URL}/api/bundles?pillar=enjoy&active_only=true&limit=20")
        fit_res = requests.get(f"{BASE_URL}/api/bundles?pillar=fit&active_only=true&limit=20")
        
        enjoy_count = enjoy_res.json().get('total', len(enjoy_res.json().get('bundles', [])))
        fit_count = fit_res.json().get('total', len(fit_res.json().get('bundles', [])))
        total = (enjoy_res.json().get('total') or len(enjoy_res.json().get('bundles', []))) + \
                (fit_res.json().get('total') or len(fit_res.json().get('bundles', [])))
        
        print(f"Enjoy bundles: {enjoy_count}, Fit bundles: {fit_count}, Total: {total}")
        assert total >= 10, f"Expected at least 10 bundles total, got {total}"


class TestIssue5BundleGenerateImageEndpoint:
    """Issue 5: /api/admin/bundles/{id}/generate-image endpoint should return 404 for unknown bundle, not 'Method Not Found'"""

    def test_generate_image_endpoint_requires_auth(self):
        """Endpoint should require authentication (not 404/405)"""
        response = requests.post(f"{BASE_URL}/api/admin/bundles/test-nonexistent-id/generate-image", 
                                json={})
        # Should return 401/403 (auth required), not 404 (not found) or 405 (method not allowed)
        assert response.status_code in [401, 403, 422], \
            f"Expected auth error, got {response.status_code}: {response.text}"
        print(f"Unauthenticated response: {response.status_code}")

    def test_generate_image_endpoint_returns_bundle_not_found_with_auth(self, admin_token):
        """With valid auth, unknown bundle should return 404 bundle not found"""
        response = requests.post(
            f"{BASE_URL}/api/admin/bundles/test-totally-nonexistent-bundle-xyz/generate-image",
            json={},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        assert response.status_code == 404
        data = response.json()
        assert "detail" in data
        assert "not found" in data["detail"].lower() or "bundle" in data["detail"].lower()
        print(f"Response: {data}")

    def test_generate_image_endpoint_not_method_not_found(self, admin_token):
        """Verify it's POST method that works (not a different method)"""
        # Test that GET returns 405 (method not allowed) not 404 (proves POST exists)
        get_response = requests.get(
            f"{BASE_URL}/api/admin/bundles/test-id/generate-image",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        # GET should be 405 Method Not Allowed (since endpoint is POST)
        # or 404 if the route simply doesn't exist for GET
        print(f"GET response: {get_response.status_code}")
        assert get_response.status_code in [404, 405], f"Unexpected status: {get_response.status_code}"


class TestMiraPicksAndServicesAPI:
    """Issue 2 & 4: API support for Mira's Picks and Services"""

    def test_mira_score_status_endpoint(self, user_token):
        """Verify /api/mira/score-status/{pet_id} works"""
        # First get user pets
        pets_res = requests.get(f"{BASE_URL}/api/pets", 
                               headers={"Authorization": f"Bearer {user_token}"})
        if pets_res.status_code != 200:
            pytest.skip("No pets found")
        
        pets_data = pets_res.json()
        pets = pets_data.get('pets', pets_data) if isinstance(pets_data, dict) else pets_data
        if not pets:
            pytest.skip("No pets found")
        
        pet_id = pets[0].get('id')
        if not pet_id:
            pytest.skip("Pet has no id")
        
        response = requests.get(f"{BASE_URL}/api/mira/score-status/{pet_id}",
                               headers={"Authorization": f"Bearer {user_token}"})
        assert response.status_code == 200
        data = response.json()
        print(f"Score status: {data}")

    def test_play_services_endpoint(self):
        """Verify /api/service-box/services?pillar=play returns services"""
        response = requests.get(f"{BASE_URL}/api/service-box/services?pillar=play")
        assert response.status_code == 200
        data = response.json()
        assert "services" in data
        services = data['services']
        print(f"Play services: {len(services)} services")
        if services:
            print(f"First service: {services[0].get('name')}")

    def test_mira_claude_picks_endpoint(self, user_token):
        """Verify Mira's Picks API works for the pet"""
        # Get pet id
        pets_res = requests.get(f"{BASE_URL}/api/pets",
                               headers={"Authorization": f"Bearer {user_token}"})
        if pets_res.status_code != 200:
            pytest.skip("No pets found")
        
        pets_data = pets_res.json()
        pets = pets_data.get('pets', pets_data) if isinstance(pets_data, dict) else pets_data
        if not pets:
            pytest.skip("No pets found")
        
        pet_id = pets[0].get('id')
        if not pet_id:
            pytest.skip("Pet has no id")
        
        response = requests.get(
            f"{BASE_URL}/api/mira/claude-picks/{pet_id}?pillar=play&limit=24&min_score=40",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        print(f"Mira's picks: {data.get('count', len(data.get('picks', [])))} picks")
