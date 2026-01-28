"""
Iteration 107 Backend Tests
Testing:
1. Documents/Paperwork section in Pet Profile Health Vault tab
2. Emergency page bundles with pet selection
3. Product wishlist integration
4. Service Desk Pet Parents and Pet Profiles views
5. Soul Score question explanation text
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
MEMBER_EMAIL = "dipali@clubconcierge.in"
MEMBER_PASSWORD = "test123"
ADMIN_USERNAME = "aditya"
ADMIN_PASSWORD = "lola4304"


class TestHealthCheck:
    """Basic health check tests"""
    
    def test_api_health(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        print("✓ API health check passed")
    
    def test_db_health(self):
        """Test database health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health/db")
        assert response.status_code == 200
        data = response.json()
        assert data.get("database") == "connected"
        print("✓ Database health check passed")


class TestMemberAuth:
    """Member authentication tests"""
    
    @pytest.fixture
    def member_token(self):
        """Get member authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": MEMBER_EMAIL, "password": MEMBER_PASSWORD}
        )
        assert response.status_code == 200, f"Login failed: {response.text}"
        data = response.json()
        assert "access_token" in data
        return data["access_token"]
    
    def test_member_login(self, member_token):
        """Test member login"""
        assert member_token is not None
        print(f"✓ Member login successful, token obtained")


class TestWishlistAPI:
    """Wishlist API tests - POST /api/member/wishlist/add, GET /api/member/wishlist, DELETE"""
    
    @pytest.fixture
    def member_token(self):
        """Get member authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": MEMBER_EMAIL, "password": MEMBER_PASSWORD}
        )
        assert response.status_code == 200
        return response.json()["access_token"]
    
    def test_add_to_wishlist(self, member_token):
        """Test adding product to wishlist - POST /api/member/wishlist/add"""
        headers = {"Authorization": f"Bearer {member_token}"}
        
        # Add a test product to wishlist
        response = requests.post(
            f"{BASE_URL}/api/member/wishlist/add",
            headers=headers,
            json={
                "product_id": "test-wishlist-product-107",
                "product_name": "Test Wishlist Product",
                "product_image": "https://example.com/test.jpg",
                "product_price": 1299
            }
        )
        assert response.status_code == 200, f"Add to wishlist failed: {response.text}"
        data = response.json()
        assert data.get("message") == "Added to wishlist"
        assert data.get("product_id") == "test-wishlist-product-107"
        print("✓ Add to wishlist API working")
    
    def test_get_wishlist(self, member_token):
        """Test getting user's wishlist - GET /api/member/wishlist"""
        headers = {"Authorization": f"Bearer {member_token}"}
        
        response = requests.get(f"{BASE_URL}/api/member/wishlist", headers=headers)
        assert response.status_code == 200, f"Get wishlist failed: {response.text}"
        data = response.json()
        assert "wishlist" in data
        assert "count" in data
        assert isinstance(data["wishlist"], list)
        print(f"✓ Get wishlist API working - {data['count']} items")
    
    def test_remove_from_wishlist(self, member_token):
        """Test removing product from wishlist - DELETE /api/member/wishlist/{product_id}"""
        headers = {"Authorization": f"Bearer {member_token}"}
        
        # First add a product
        requests.post(
            f"{BASE_URL}/api/member/wishlist/add",
            headers=headers,
            json={
                "product_id": "test-remove-product-107",
                "product_name": "Test Remove Product",
                "product_image": "https://example.com/test.jpg",
                "product_price": 999
            }
        )
        
        # Then remove it
        response = requests.delete(
            f"{BASE_URL}/api/member/wishlist/test-remove-product-107",
            headers=headers
        )
        assert response.status_code == 200, f"Remove from wishlist failed: {response.text}"
        data = response.json()
        assert data.get("message") == "Removed from wishlist"
        print("✓ Remove from wishlist API working")


class TestEmergencyBundles:
    """Emergency bundles API tests"""
    
    def test_get_emergency_bundles(self):
        """Test getting emergency bundles - GET /api/emergency/bundles"""
        response = requests.get(f"{BASE_URL}/api/emergency/bundles")
        assert response.status_code == 200, f"Get bundles failed: {response.text}"
        data = response.json()
        assert "bundles" in data
        assert len(data["bundles"]) > 0
        
        # Verify bundle structure
        bundle = data["bundles"][0]
        assert "id" in bundle
        assert "name" in bundle
        assert "price" in bundle
        assert "original_price" in bundle
        print(f"✓ Emergency bundles API working - {len(data['bundles'])} bundles")
    
    def test_get_emergency_products(self):
        """Test getting emergency products - GET /api/emergency/products"""
        response = requests.get(f"{BASE_URL}/api/emergency/products")
        assert response.status_code == 200, f"Get products failed: {response.text}"
        data = response.json()
        assert "products" in data
        print(f"✓ Emergency products API working - {len(data['products'])} products")
    
    def test_get_emergency_vets(self):
        """Test getting emergency vets - GET /api/emergency/vets"""
        response = requests.get(f"{BASE_URL}/api/emergency/vets")
        assert response.status_code == 200, f"Get vets failed: {response.text}"
        data = response.json()
        assert "vets" in data
        print(f"✓ Emergency vets API working - {len(data['vets'])} vets")


class TestPetProfile:
    """Pet profile and health vault tests"""
    
    @pytest.fixture
    def member_token(self):
        """Get member authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": MEMBER_EMAIL, "password": MEMBER_PASSWORD}
        )
        assert response.status_code == 200
        return response.json()["access_token"]
    
    def test_get_user_pets(self, member_token):
        """Test getting user's pets - GET /api/pets/my-pets"""
        headers = {"Authorization": f"Bearer {member_token}"}
        
        response = requests.get(f"{BASE_URL}/api/pets/my-pets", headers=headers)
        assert response.status_code == 200, f"Get pets failed: {response.text}"
        data = response.json()
        assert "pets" in data
        assert len(data["pets"]) > 0
        
        # Verify pet structure
        pet = data["pets"][0]
        assert "id" in pet
        assert "name" in pet
        print(f"✓ Get user pets API working - {len(data['pets'])} pets")
        return data["pets"][0]["id"]
    
    def test_get_pet_vaccines(self, member_token):
        """Test getting pet vaccines - GET /api/pet-vault/{pet_id}/vaccines"""
        headers = {"Authorization": f"Bearer {member_token}"}
        
        # First get a pet ID
        pets_response = requests.get(f"{BASE_URL}/api/pets/my-pets", headers=headers)
        pet_id = pets_response.json()["pets"][0]["id"]
        
        response = requests.get(f"{BASE_URL}/api/pet-vault/{pet_id}/vaccines")
        assert response.status_code == 200, f"Get vaccines failed: {response.text}"
        data = response.json()
        assert "vaccines" in data
        print(f"✓ Pet vaccines API working - {len(data['vaccines'])} vaccines")
    
    def test_get_pet_medications(self, member_token):
        """Test getting pet medications - GET /api/pet-vault/{pet_id}/medications"""
        headers = {"Authorization": f"Bearer {member_token}"}
        
        # First get a pet ID
        pets_response = requests.get(f"{BASE_URL}/api/pets/my-pets", headers=headers)
        pet_id = pets_response.json()["pets"][0]["id"]
        
        response = requests.get(f"{BASE_URL}/api/pet-vault/{pet_id}/medications")
        assert response.status_code == 200, f"Get medications failed: {response.text}"
        data = response.json()
        assert "medications" in data
        print(f"✓ Pet medications API working - {len(data['medications'])} medications")


class TestAdminServiceDesk:
    """Admin Service Desk API tests - Pet Parents and Pet Profiles views"""
    
    @pytest.fixture
    def admin_headers(self):
        """Get admin authentication headers"""
        import base64
        credentials = base64.b64encode(f"{ADMIN_USERNAME}:{ADMIN_PASSWORD}".encode()).decode()
        return {"Authorization": f"Basic {credentials}"}
    
    def test_get_members_directory(self, admin_headers):
        """Test getting members directory (Pet Parents) - GET /api/admin/members/directory"""
        response = requests.get(
            f"{BASE_URL}/api/admin/members/directory",
            headers=admin_headers
        )
        assert response.status_code == 200, f"Get members failed: {response.text}"
        data = response.json()
        assert "members" in data
        print(f"✓ Admin members directory API working - {len(data['members'])} members")
    
    def test_get_admin_pets(self, admin_headers):
        """Test getting all pets (Pet Profiles) - GET /api/admin/pets"""
        response = requests.get(
            f"{BASE_URL}/api/admin/pets?limit=100",
            headers=admin_headers
        )
        assert response.status_code == 200, f"Get pets failed: {response.text}"
        data = response.json()
        assert "pets" in data
        print(f"✓ Admin pets API working - {len(data['pets'])} pets")


class TestPetSoulScore:
    """Pet Soul Score API tests"""
    
    @pytest.fixture
    def member_token(self):
        """Get member authentication token"""
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": MEMBER_EMAIL, "password": MEMBER_PASSWORD}
        )
        assert response.status_code == 200
        return response.json()["access_token"]
    
    def test_get_pet_score_config(self):
        """Test getting pet score configuration - GET /api/pet-score/config"""
        response = requests.get(f"{BASE_URL}/api/pet-score/config")
        assert response.status_code == 200, f"Get config failed: {response.text}"
        data = response.json()
        # Should have question weights and categories
        assert "questions" in data or "categories" in data or "config" in data
        print("✓ Pet score config API working")
    
    def test_get_pet_score_tiers(self):
        """Test getting pet score tiers - GET /api/pet-score/tiers"""
        response = requests.get(f"{BASE_URL}/api/pet-score/tiers")
        assert response.status_code == 200, f"Get tiers failed: {response.text}"
        data = response.json()
        assert "tiers" in data
        print(f"✓ Pet score tiers API working - {len(data['tiers'])} tiers")
    
    def test_get_pet_score_state(self, member_token):
        """Test getting pet score state - GET /api/pet-score/{pet_id}/score_state"""
        headers = {"Authorization": f"Bearer {member_token}"}
        
        # First get a pet ID
        pets_response = requests.get(f"{BASE_URL}/api/pets/my-pets", headers=headers)
        pet_id = pets_response.json()["pets"][0]["id"]
        
        response = requests.get(
            f"{BASE_URL}/api/pet-score/{pet_id}/score_state",
            headers=headers
        )
        assert response.status_code == 200, f"Get score state failed: {response.text}"
        data = response.json()
        # Should have score information
        assert "score" in data or "overall_score" in data or "tier" in data
        print("✓ Pet score state API working")


class TestProductDetailPage:
    """Product detail page API tests"""
    
    def test_get_products(self):
        """Test getting products - GET /api/products"""
        response = requests.get(f"{BASE_URL}/api/products?limit=5")
        assert response.status_code == 200, f"Get products failed: {response.text}"
        data = response.json()
        assert "products" in data
        assert len(data["products"]) > 0
        print(f"✓ Products API working - {len(data['products'])} products")
    
    def test_get_single_product(self):
        """Test getting single product - GET /api/products/{id}"""
        # First get a product ID
        products_response = requests.get(f"{BASE_URL}/api/products?limit=1")
        product_id = products_response.json()["products"][0]["id"]
        
        response = requests.get(f"{BASE_URL}/api/products/{product_id}")
        assert response.status_code == 200, f"Get product failed: {response.text}"
        data = response.json()
        assert "product" in data or "id" in data
        print("✓ Single product API working")


# Cleanup test data
@pytest.fixture(scope="session", autouse=True)
def cleanup_test_data():
    """Cleanup test data after all tests"""
    yield
    # Cleanup wishlist test items
    try:
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            json={"email": MEMBER_EMAIL, "password": MEMBER_PASSWORD}
        )
        if response.status_code == 200:
            token = response.json()["access_token"]
            headers = {"Authorization": f"Bearer {token}"}
            # Remove test wishlist items
            for product_id in ["test-wishlist-product-107", "test-remove-product-107", "test-product-123"]:
                requests.delete(f"{BASE_URL}/api/member/wishlist/{product_id}", headers=headers)
    except Exception as e:
        print(f"Cleanup warning: {e}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
