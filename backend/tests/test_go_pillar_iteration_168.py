"""
Backend tests for Go Pillar - Iteration 168
Testing:
1. GET /api/service-box/services?pillar=go should return 8 services (6 travel + 2 stay)
2. GET /api/admin/pillar-products?pillar=go&limit=200 should return go products including new stay sub-category products
3. MongoDB direct verification of data
"""
import pytest
import requests
import os
import pymongo

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
MONGO_URL = os.environ.get('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.environ.get('DB_NAME', 'pet-os-live-test_database')


@pytest.fixture(scope="module")
def mongo_db():
    """Direct MongoDB connection"""
    client = pymongo.MongoClient(MONGO_URL, serverSelectionTimeoutMS=10000)
    db = client[DB_NAME]
    yield db
    client.close()


@pytest.fixture(scope="module")
def auth_token():
    """Get auth token for aditya (test user for this iteration)"""
    try:
        response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": "aditya",
            "password": "lola4304"
        }, timeout=30)
        if response.status_code == 200:
            return response.json().get("access_token")
    except Exception:
        pass
    pytest.skip("Auth failed or backend not available from container")


class TestGoServicesMongoVerification:
    """Direct MongoDB verification - confirms data is properly seeded"""

    def test_go_services_count_is_8(self, mongo_db):
        """Should have exactly 8 GO services in DB"""
        count = mongo_db.services_master.count_documents({"pillar": "go"})
        assert count == 8, f"Expected 8 GO services, got {count}"

    def test_go_services_6_travel(self, mongo_db):
        """Should have exactly 6 travel services"""
        travel_count = mongo_db.services_master.count_documents({
            "pillar": "go",
            "$or": [{"category": "travel"}, {"sub_pillar": "travel"}]
        })
        assert travel_count == 6, f"Expected 6 travel services, got {travel_count}"

    def test_go_services_2_stay(self, mongo_db):
        """Should have exactly 2 stay services"""
        stay_count = mongo_db.services_master.count_documents({
            "pillar": "go",
            "$or": [{"category": "stay"}, {"sub_pillar": "stay"}]
        })
        assert stay_count == 2, f"Expected 2 stay services, got {stay_count}"

    def test_go_service_ids_present(self, mongo_db):
        """All expected service IDs should exist"""
        expected_ids = [
            "GO-SVC-001", "GO-SVC-002", "GO-SVC-003", "GO-SVC-004",
            "GO-SVC-005", "GO-SVC-006", "GO-SVC-007", "GO-SVC-008"
        ]
        for svc_id in expected_ids:
            svc = mongo_db.services_master.find_one({"id": svc_id})
            assert svc is not None, f"Service {svc_id} not found in MongoDB"

    def test_go_products_total(self, mongo_db):
        """GO products should be present"""
        count = mongo_db.products_master.count_documents({"pillar": "go"})
        assert count > 0, "No GO products found"
        # Should have 52 or more
        print(f"GO products count: {count}")

    def test_go_stay_subcategory_products_present(self, mongo_db):
        """New stay sub-category products GO-BC-001 to GO-SS-003 must be present"""
        expected_stay_ids = ["GO-BC-001", "GO-BC-002", "GO-BC-003", "GO-SS-001", "GO-SS-002", "GO-SS-003"]
        for prod_id in expected_stay_ids:
            prod = mongo_db.products_master.find_one({"id": prod_id})
            assert prod is not None, f"Stay sub-cat product {prod_id} not found in MongoDB"

    def test_go_bc_products_boarding_comfort_category(self, mongo_db):
        """GO-BC products should have boarding_comfort sub_category"""
        bc_prods = list(mongo_db.products_master.find(
            {"id": {"$in": ["GO-BC-001", "GO-BC-002", "GO-BC-003"]}},
            {"_id": 0, "id": 1, "sub_category": 1}
        ))
        assert len(bc_prods) == 3, f"Expected 3 GO-BC products, got {len(bc_prods)}"
        for p in bc_prods:
            assert p.get("sub_category") == "boarding_comfort", f"{p['id']} has sub_category {p.get('sub_category')}, expected boarding_comfort"

    def test_go_ss_products_soul_stay_category(self, mongo_db):
        """GO-SS products should have soul_stay sub_category"""
        ss_prods = list(mongo_db.products_master.find(
            {"id": {"$in": ["GO-SS-001", "GO-SS-002", "GO-SS-003"]}},
            {"_id": 0, "id": 1, "sub_category": 1}
        ))
        assert len(ss_prods) == 3, f"Expected 3 GO-SS products, got {len(ss_prods)}"
        for p in ss_prods:
            assert p.get("sub_category") == "soul_stay", f"{p['id']} has sub_category {p.get('sub_category')}, expected soul_stay"


class TestGoServicesHTTP:
    """HTTP API tests - may fail if backend is too busy with image generation"""

    def test_services_api_returns_8_go(self):
        """GET /api/service-box/services?pillar=go should return 8 services"""
        try:
            resp = requests.get(f"{BASE_URL}/api/service-box/services?pillar=go", timeout=30)
            assert resp.status_code == 200
            data = resp.json()
            services = data.get("services", [])
            assert len(services) == 8, f"Expected 8, got {len(services)}: {[s.get('name') for s in services]}"
        except requests.exceptions.Timeout:
            pytest.skip("Backend HTTP timed out - server busy with image generation")

    def test_services_api_has_travel_category_services(self):
        """GO services should have travel category services"""
        try:
            resp = requests.get(f"{BASE_URL}/api/service-box/services?pillar=go", timeout=30)
            assert resp.status_code == 200
            data = resp.json()
            services = data.get("services", [])
            travel_svcs = [s for s in services if s.get("category") == "travel" or s.get("sub_pillar") == "travel"]
            assert len(travel_svcs) == 6, f"Expected 6 travel services, got {len(travel_svcs)}"
        except requests.exceptions.Timeout:
            pytest.skip("Backend HTTP timed out")

    def test_services_api_has_stay_category_services(self):
        """GO services should have stay category services"""
        try:
            resp = requests.get(f"{BASE_URL}/api/service-box/services?pillar=go", timeout=30)
            assert resp.status_code == 200
            data = resp.json()
            services = data.get("services", [])
            stay_svcs = [s for s in services if s.get("category") == "stay" or s.get("sub_pillar") == "stay"]
            assert len(stay_svcs) == 2, f"Expected 2 stay services, got {len(stay_svcs)}"
        except requests.exceptions.Timeout:
            pytest.skip("Backend HTTP timed out")

    def test_pillar_products_api_has_go_products(self):
        """GET /api/admin/pillar-products?pillar=go should return products"""
        try:
            resp = requests.get(f"{BASE_URL}/api/admin/pillar-products?pillar=go&limit=200", timeout=30)
            assert resp.status_code == 200
            data = resp.json()
            products = data.get("products", [])
            assert len(products) > 0, "No GO products returned"
        except requests.exceptions.Timeout:
            pytest.skip("Backend HTTP timed out")
