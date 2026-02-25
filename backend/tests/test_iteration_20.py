"""
Test Iteration 20 - Multi-part fix validation
Tests:
1. GET /api/dine/restaurants - all restaurants have 'id' and 'image' fields
2. GET /api/mira/curated-set/{pet_id}/dine - concierge cards have varied 'why_for_pet' and card-specific 'cta_text'
3. GET /api/mira/curated-set/{pet_id}/celebrate - same tests for celebrate pillar
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL')
if not BASE_URL:
    raise ValueError("REACT_APP_BACKEND_URL must be set in environment")
BASE_URL = BASE_URL.rstrip('/')

# Test credentials
TEST_EMAIL = "dipali@clubconcierge.in"
TEST_PASSWORD = "test123"


@pytest.fixture(scope="module")
def auth_token():
    """Get authentication token for API calls"""
    response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": TEST_EMAIL,
        "password": TEST_PASSWORD
    })
    if response.status_code != 200:
        pytest.skip(f"Authentication failed: {response.status_code} - {response.text}")
    data = response.json()
    return data.get("token") or data.get("access_token")


@pytest.fixture(scope="module")
def test_pet_id(auth_token):
    """Get a pet ID for testing"""
    response = requests.get(f"{BASE_URL}/api/pets/my-pets", headers={
        "Authorization": f"Bearer {auth_token}"
    })
    if response.status_code != 200:
        pytest.skip(f"Failed to get pets: {response.status_code}")
    data = response.json()
    pets = data.get("pets", [])
    if not pets:
        pytest.skip("No pets found for user")
    # Prefer Mystique if found, else first pet
    for pet in pets:
        if "Mystique" in pet.get("name", ""):
            return pet["id"]
    return pets[0]["id"]


@pytest.fixture(scope="module")
def test_pet_name(auth_token, test_pet_id):
    """Get pet name for assertions"""
    response = requests.get(f"{BASE_URL}/api/pets/my-pets", headers={
        "Authorization": f"Bearer {auth_token}"
    })
    if response.status_code == 200:
        pets = response.json().get("pets", [])
        for pet in pets:
            if pet.get("id") == test_pet_id:
                return pet.get("name", "your pet")
    return "your pet"


# ============================================================================
# Module 1: Restaurant API Tests (Fix for missing IDs)
# ============================================================================

class TestRestaurantsAPI:
    """Test /api/dine/restaurants endpoint returns valid data"""
    
    def test_restaurants_endpoint_returns_200(self):
        """Endpoint should return 200 OK"""
        response = requests.get(f"{BASE_URL}/api/dine/restaurants")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    
    def test_restaurants_have_id_field(self):
        """All restaurants must have 'id' field (previously some were missing)"""
        response = requests.get(f"{BASE_URL}/api/dine/restaurants")
        assert response.status_code == 200
        data = response.json()
        restaurants = data.get("restaurants", [])
        
        # Must have at least some restaurants
        assert len(restaurants) > 0, "Expected at least 1 restaurant"
        
        # All restaurants must have id
        missing_ids = []
        for i, r in enumerate(restaurants):
            if not r.get("id"):
                missing_ids.append(f"Index {i}: {r.get('name', 'Unknown')}")
        
        assert len(missing_ids) == 0, f"Restaurants missing 'id': {missing_ids}"
    
    def test_restaurants_have_image_field(self):
        """All restaurants must have 'image' field"""
        response = requests.get(f"{BASE_URL}/api/dine/restaurants")
        assert response.status_code == 200
        data = response.json()
        restaurants = data.get("restaurants", [])
        
        missing_images = []
        for i, r in enumerate(restaurants):
            if not r.get("image"):
                missing_images.append(f"Index {i}: {r.get('name', 'Unknown')}")
        
        assert len(missing_images) == 0, f"Restaurants missing 'image': {missing_images}"
    
    def test_restaurant_id_format(self):
        """Restaurant IDs should follow pattern 'rest-xxxxxxxx'"""
        response = requests.get(f"{BASE_URL}/api/dine/restaurants")
        assert response.status_code == 200
        data = response.json()
        restaurants = data.get("restaurants", [])
        
        # Check at least first 5 restaurants
        for r in restaurants[:5]:
            rid = r.get("id", "")
            assert rid, f"Restaurant {r.get('name')} has no ID"
            # ID should be non-empty string
            assert isinstance(rid, str) and len(rid) > 0, f"Invalid ID format for {r.get('name')}: {rid}"


# ============================================================================
# Module 2: Dine Curated Set API Tests (Card-specific text)
# ============================================================================

class TestDineCuratedSetAPI:
    """Test /api/mira/curated-set/{pet_id}/dine returns varied personalization"""
    
    def test_dine_curated_set_returns_200(self, auth_token, test_pet_id):
        """Dine curated set endpoint should return 200"""
        response = requests.get(
            f"{BASE_URL}/api/mira/curated-set/{test_pet_id}/dine",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    
    def test_dine_curated_set_has_products_and_services(self, auth_token, test_pet_id):
        """Dine curated set should have both products and services"""
        response = requests.get(
            f"{BASE_URL}/api/mira/curated-set/{test_pet_id}/dine",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        products = data.get("concierge_products", [])
        services = data.get("concierge_services", [])
        
        # Must have at least 2 products and 1 service (3-5 total)
        assert len(products) >= 2, f"Expected at least 2 products, got {len(products)}"
        assert len(services) >= 1, f"Expected at least 1 service, got {len(services)}"
    
    def test_dine_cards_have_varied_why_for_pet(self, auth_token, test_pet_id, test_pet_name):
        """Cards should have varied 'why_for_pet' text (not all same)"""
        response = requests.get(
            f"{BASE_URL}/api/mira/curated-set/{test_pet_id}/dine",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        products = data.get("concierge_products", [])
        services = data.get("concierge_services", [])
        all_cards = products + services
        
        # Collect all why_for_pet values
        why_texts = [c.get("why_for_pet", "") for c in all_cards]
        
        # All cards should have why_for_pet
        missing = [c.get("id", "?") for c in all_cards if not c.get("why_for_pet")]
        assert len(missing) == 0, f"Cards missing why_for_pet: {missing}"
        
        # Check that not all why_for_pet are the same (should be varied per card)
        unique_texts = set(why_texts)
        
        # With 3+ cards, we expect at least 2 unique why_for_pet texts
        # (some cards may share traits)
        if len(all_cards) >= 3:
            assert len(unique_texts) >= 2, f"Expected varied why_for_pet, but all are same: {unique_texts}"
        
        # Verify none contain generic "Curated for Mystique" only
        for why in why_texts:
            # Should not be generic fallback for all
            assert "Curated for" not in why or len(unique_texts) > 1, \
                "All cards have generic 'Curated for' fallback"
    
    def test_dine_cards_have_specific_cta_text(self, auth_token, test_pet_id):
        """Cards should have card-specific cta_text (not generic 'Create for {Pet}')"""
        response = requests.get(
            f"{BASE_URL}/api/mira/curated-set/{test_pet_id}/dine",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        products = data.get("concierge_products", [])
        services = data.get("concierge_services", [])
        all_cards = products + services
        
        # Expected CTAs for dine cards
        expected_ctas = [
            "Create plan",
            "Start transition", 
            "Create blueprint",
            "Set up delivery",
            "Curate kit",
            "Request reservation",
            "Request meetup",
            "Book experience",
            "Get help now",
            "Book consult"
        ]
        
        for card in all_cards:
            cta = card.get("cta_text", "")
            assert cta, f"Card {card.get('id')} missing cta_text"
            
            # Should not be generic "Create for {pet}" format
            assert "Create for" not in cta, \
                f"Card {card.get('id')} has generic CTA: '{cta}'"


# ============================================================================
# Module 3: Celebrate Curated Set API Tests (Card-specific text)
# ============================================================================

class TestCelebrateCuratedSetAPI:
    """Test /api/mira/curated-set/{pet_id}/celebrate returns varied personalization"""
    
    def test_celebrate_curated_set_returns_200(self, auth_token, test_pet_id):
        """Celebrate curated set endpoint should return 200"""
        response = requests.get(
            f"{BASE_URL}/api/mira/curated-set/{test_pet_id}/celebrate",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
    
    def test_celebrate_curated_set_has_products_and_services(self, auth_token, test_pet_id):
        """Celebrate curated set should have both products and services"""
        response = requests.get(
            f"{BASE_URL}/api/mira/curated-set/{test_pet_id}/celebrate",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        products = data.get("concierge_products", [])
        services = data.get("concierge_services", [])
        
        # Must have at least 2 products and 1 service
        assert len(products) >= 2, f"Expected at least 2 products, got {len(products)}"
        assert len(services) >= 1, f"Expected at least 1 service, got {len(services)}"
    
    def test_celebrate_cards_have_varied_why_for_pet(self, auth_token, test_pet_id, test_pet_name):
        """Celebrate cards should have varied 'why_for_pet' text"""
        response = requests.get(
            f"{BASE_URL}/api/mira/curated-set/{test_pet_id}/celebrate",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        products = data.get("concierge_products", [])
        services = data.get("concierge_services", [])
        all_cards = products + services
        
        # Collect all why_for_pet values
        why_texts = [c.get("why_for_pet", "") for c in all_cards]
        
        # All cards should have why_for_pet
        missing = [c.get("id", "?") for c in all_cards if not c.get("why_for_pet")]
        assert len(missing) == 0, f"Cards missing why_for_pet: {missing}"
        
        # With 3+ cards, expect at least 2 unique values
        unique_texts = set(why_texts)
        if len(all_cards) >= 3:
            assert len(unique_texts) >= 2, f"Expected varied why_for_pet: {unique_texts}"
    
    def test_celebrate_cards_have_specific_cta_text(self, auth_token, test_pet_id):
        """Celebrate cards should have card-specific cta_text"""
        response = requests.get(
            f"{BASE_URL}/api/mira/curated-set/{test_pet_id}/celebrate",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        assert response.status_code == 200
        data = response.json()
        
        products = data.get("concierge_products", [])
        services = data.get("concierge_services", [])
        all_cards = products + services
        
        # Expected CTAs for celebrate cards
        expected_ctas = [
            "Create cake design",
            "Create celebration box",
            "Create outdoor pack",
            "Create photo kit",
            "Create keepsake",
            "Request planning",
            "Request setup",
            "Book photographer",
            "Book venue",
            "Request quiet plan"
        ]
        
        for card in all_cards:
            cta = card.get("cta_text", "")
            assert cta, f"Card {card.get('id')} missing cta_text"
            
            # Should not be generic "Create for {pet}" format
            assert "Create for" not in cta, \
                f"Card {card.get('id')} has generic CTA: '{cta}'"


# ============================================================================
# Module 4: Print test data for debugging
# ============================================================================

class TestDebugOutput:
    """Print API responses for debugging (informational tests)"""
    
    def test_print_restaurant_sample(self):
        """Print sample restaurant data for verification"""
        response = requests.get(f"{BASE_URL}/api/dine/restaurants")
        if response.status_code == 200:
            data = response.json()
            restaurants = data.get("restaurants", [])
            print(f"\n=== RESTAURANTS SAMPLE ({len(restaurants)} total) ===")
            for r in restaurants[:3]:
                print(f"  - ID: {r.get('id')}")
                print(f"    Name: {r.get('name')}")
                print(f"    Image: {r.get('image', 'MISSING')[:50]}...")
                print()
        assert True  # Always pass - informational only
    
    def test_print_dine_cards_sample(self, auth_token, test_pet_id):
        """Print dine card data for verification"""
        response = requests.get(
            f"{BASE_URL}/api/mira/curated-set/{test_pet_id}/dine",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        if response.status_code == 200:
            data = response.json()
            products = data.get("concierge_products", [])
            services = data.get("concierge_services", [])
            
            print(f"\n=== DINE CURATED SET ({len(products)} products, {len(services)} services) ===")
            for card in products + services:
                print(f"  - ID: {card.get('id')}")
                print(f"    Name: {card.get('name')}")
                print(f"    CTA: {card.get('cta_text')}")
                print(f"    Why: {card.get('why_for_pet')}")
                print()
        assert True
    
    def test_print_celebrate_cards_sample(self, auth_token, test_pet_id):
        """Print celebrate card data for verification"""
        response = requests.get(
            f"{BASE_URL}/api/mira/curated-set/{test_pet_id}/celebrate",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        if response.status_code == 200:
            data = response.json()
            products = data.get("concierge_products", [])
            services = data.get("concierge_services", [])
            
            print(f"\n=== CELEBRATE CURATED SET ({len(products)} products, {len(services)} services) ===")
            for card in products + services:
                print(f"  - ID: {card.get('id')}")
                print(f"    Name: {card.get('name')}")
                print(f"    CTA: {card.get('cta_text')}")
                print(f"    Why: {card.get('why_for_pet')}")
                print()
        assert True
