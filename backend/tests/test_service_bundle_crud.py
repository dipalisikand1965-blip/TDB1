"""
Test: ServiceBox & BundleBox CRUD + Import/Export CSV
Tests: Delete service, export service CSV, import service CSV,
       create bundle, delete bundle, export bundle CSV, import bundle CSV
"""
import pytest
import requests
import os
import io
import csv

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
ADMIN_AUTH = "YWRpdHlhOmxvbGE0MzA0"  # aditya:lola4304 in base64

HEADERS = {
    "Content-Type": "application/json",
    "Authorization": f"Basic {ADMIN_AUTH}"
}


# ─── Fixtures ────────────────────────────────────────────────────────────────

@pytest.fixture(scope="module")
def created_bundle_id():
    """Create a test bundle and return its ID; cleanup after module"""
    payload = {
        "name": "TEST_Bundle_AutoDelete",
        "pillar": "care",
        "price": 500,
        "description": "Auto-created by test suite",
        "is_active": True,
        "is_soul_made": False,
    }
    res = requests.post(f"{BASE_URL}/api/admin/bundles/all", json=payload, headers=HEADERS)
    assert res.status_code in [200, 201], f"Setup failed: {res.status_code} {res.text}"
    data = res.json()
    bundle_id = data.get("bundle", {}).get("id") or data.get("id")
    assert bundle_id, f"No bundle ID in response: {data}"
    yield bundle_id
    # Cleanup
    requests.delete(f"{BASE_URL}/api/admin/bundles/all/{bundle_id}", headers=HEADERS)


# ─── SERVICE-BOX TESTS ───────────────────────────────────────────────────────

class TestServiceBoxExportCSV:
    """Test /api/service-box/export-csv returns JSON with services list"""

    def test_export_csv_returns_200(self):
        res = requests.get(f"{BASE_URL}/api/service-box/export-csv?pillar=care", headers=HEADERS)
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text[:200]}"
        print(f"✅ Service export status: {res.status_code}")

    def test_export_csv_returns_services_list(self):
        res = requests.get(f"{BASE_URL}/api/service-box/export-csv?pillar=care", headers=HEADERS)
        assert res.status_code == 200
        data = res.json()
        services = data.get("services") or data.get("items") or (data if isinstance(data, list) else [])
        assert isinstance(services, list), f"Expected list, got: {type(services)}"
        assert len(services) > 0, "No services returned from export"
        print(f"✅ Exported {len(services)} services")

    def test_export_csv_has_required_fields(self):
        res = requests.get(f"{BASE_URL}/api/service-box/export-csv?pillar=care", headers=HEADERS)
        assert res.status_code == 200
        data = res.json()
        services = data.get("services") or (data if isinstance(data, list) else [])
        if services:
            first = services[0]
            required = ["id", "name", "pillar"]
            for field in required:
                assert field in first, f"Missing field '{field}' in export response"
            print(f"✅ Export fields present: {list(first.keys())[:10]}")


class TestServiceBoxDelete:
    """Test DELETE /api/service-box/services/{id}"""

    def test_delete_nonexistent_service_returns_404(self):
        res = requests.delete(
            f"{BASE_URL}/api/service-box/services/TEST_NONEXISTENT_999",
            headers=HEADERS
        )
        assert res.status_code == 404, f"Expected 404 for nonexistent service, got {res.status_code}"
        print(f"✅ Delete nonexistent: 404 as expected")

    def test_delete_service_and_verify(self):
        """Create a service via POST then delete it"""
        # First create a service
        create_res = requests.post(
            f"{BASE_URL}/api/service-box/services",
            json={
                "name": "TEST_DeleteMe_Service",
                "pillar": "care",
                "description": "To be deleted",
                "category": "test",
                "base_price": 0,
                "is_active": True,
            },
            headers=HEADERS
        )
        if create_res.status_code not in [200, 201]:
            pytest.skip(f"Could not create service for delete test: {create_res.status_code}")
        
        created = create_res.json()
        svc_id = created.get("service", {}).get("id") or created.get("id")
        if not svc_id:
            pytest.skip(f"No service ID in create response: {created}")

        # Now delete it
        del_res = requests.delete(
            f"{BASE_URL}/api/service-box/services/{svc_id}",
            headers=HEADERS
        )
        assert del_res.status_code in [200, 204], f"Delete failed: {del_res.status_code} {del_res.text}"
        
        # Verify it's gone
        get_res = requests.get(
            f"{BASE_URL}/api/service-box/services/{svc_id}",
            headers=HEADERS
        )
        assert get_res.status_code == 404, "Service still exists after deletion"
        print(f"✅ Service created, deleted, and verified gone: {svc_id}")


class TestServiceBoxImportCSV:
    """Test POST /api/admin/services/import-csv"""

    def test_import_services_csv_returns_200(self):
        payload = [
            {
                "name": "TEST_Import_Service_One",
                "pillar": "care",
                "category": "test_category",
                "base_price": 100,
                "is_active": True,
                "approval_status": "live",
                "mira_whisper": "Great for all dogs",
                "includes": ["step1", "step2"],
                "breed_whispers": {"default": "For all breeds"},
            }
        ]
        res = requests.post(
            f"{BASE_URL}/api/admin/services/import-csv",
            json=payload,
            headers=HEADERS
        )
        assert res.status_code == 200, f"Import failed: {res.status_code} {res.text}"
        data = res.json()
        assert "imported" in data, f"Missing 'imported' key: {data}"
        assert data["imported"] >= 1, f"Expected >=1 imported, got {data['imported']}"
        print(f"✅ Services imported: {data['imported']}")


# ─── BUNDLE-BOX TESTS ────────────────────────────────────────────────────────

class TestBundleCreate:
    """Test POST /api/admin/bundles/all"""

    def test_create_bundle_success(self):
        payload = {
            "name": "TEST_CreateBundle_Check",
            "pillar": "celebrate",
            "price": 999,
            "description": "Test bundle creation",
            "is_active": True,
            "is_soul_made": False,
        }
        res = requests.post(f"{BASE_URL}/api/admin/bundles/all", json=payload, headers=HEADERS)
        assert res.status_code in [200, 201], f"Create failed: {res.status_code} {res.text}"
        data = res.json()
        assert data.get("success") == True, f"Expected success:true, got: {data}"
        bundle = data.get("bundle", {})
        assert bundle.get("id"), f"No ID in response: {bundle}"
        assert bundle.get("name") == "TEST_CreateBundle_Check"
        print(f"✅ Bundle created: {bundle.get('id')}")
        # Cleanup
        requests.delete(f"{BASE_URL}/api/admin/bundles/all/{bundle['id']}", headers=HEADERS)

    def test_create_bundle_without_name_returns_400(self):
        res = requests.post(
            f"{BASE_URL}/api/admin/bundles/all",
            json={"pillar": "care", "price": 0},
            headers=HEADERS
        )
        assert res.status_code == 400, f"Expected 400 for missing name, got {res.status_code}"
        print(f"✅ Bundle without name: 400 as expected")

    def test_create_bundle_auto_generates_id(self):
        payload = {"name": "TEST_AutoID_Bundle", "pillar": "dine"}
        res = requests.post(f"{BASE_URL}/api/admin/bundles/all", json=payload, headers=HEADERS)
        assert res.status_code in [200, 201]
        data = res.json()
        bundle_id = data.get("bundle", {}).get("id")
        assert bundle_id and bundle_id.startswith("bun-"), f"Expected bun-XXXX ID, got: {bundle_id}"
        print(f"✅ Auto-generated ID: {bundle_id}")
        # Cleanup
        requests.delete(f"{BASE_URL}/api/admin/bundles/all/{bundle_id}", headers=HEADERS)


class TestBundleDelete:
    """Test DELETE /api/admin/bundles/all/{id}"""

    def test_delete_bundle_success(self, created_bundle_id):
        res = requests.delete(
            f"{BASE_URL}/api/admin/bundles/all/{created_bundle_id}",
            headers=HEADERS
        )
        assert res.status_code in [200, 204], f"Delete failed: {res.status_code} {res.text}"
        data = res.json()
        assert data.get("success") == True or data.get("deleted") == True, f"Unexpected response: {data}"
        print(f"✅ Bundle deleted: {created_bundle_id}")

    def test_delete_nonexistent_bundle_returns_404(self):
        res = requests.delete(
            f"{BASE_URL}/api/admin/bundles/all/NONEXISTENT_BUNDLE_999",
            headers=HEADERS
        )
        assert res.status_code == 404, f"Expected 404, got {res.status_code}"
        print(f"✅ Delete nonexistent bundle: 404 as expected")


class TestBundleExportCSV:
    """Test GET /api/admin/bundles/all/export-csv"""

    def test_export_csv_returns_200(self):
        res = requests.get(
            f"{BASE_URL}/api/admin/bundles/all/export-csv",
            headers=HEADERS
        )
        assert res.status_code == 200, f"Export CSV failed: {res.status_code} {res.text[:200]}"
        print(f"✅ Bundle export status: {res.status_code}")

    def test_export_csv_content_type_is_csv(self):
        res = requests.get(
            f"{BASE_URL}/api/admin/bundles/all/export-csv",
            headers=HEADERS
        )
        assert res.status_code == 200
        content_type = res.headers.get("content-type", "")
        assert "text/csv" in content_type or "csv" in content_type, \
            f"Expected text/csv content type, got: {content_type}"
        print(f"✅ Content-Type: {content_type}")

    def test_export_csv_has_18_columns(self):
        """The export MUST have exactly 18 columns as required"""
        res = requests.get(
            f"{BASE_URL}/api/admin/bundles/all/export-csv",
            headers=HEADERS
        )
        assert res.status_code == 200
        content = res.text
        reader = csv.reader(io.StringIO(content))
        headers = next(reader)
        
        EXPECTED_18_COLS = [
            "id", "name", "pillar", "price", "discount_percent", "is_active", "is_soul_made",
            "description", "category", "items", "tags", "image_url", "approval_status",
            "paw_points_eligible", "paw_points_value", "mira_hint", "created_at", "updated_at"
        ]
        assert len(headers) == 18, f"Expected 18 columns, got {len(headers)}: {headers}"
        
        for col in EXPECTED_18_COLS:
            assert col in headers, f"Missing column '{col}' in export. Got: {headers}"
        
        print(f"✅ Export has exactly 18 columns: {headers}")

    def test_export_csv_has_data_rows(self):
        res = requests.get(
            f"{BASE_URL}/api/admin/bundles/all/export-csv",
            headers=HEADERS
        )
        assert res.status_code == 200
        content = res.text
        lines = [l for l in content.strip().split('\n') if l]
        assert len(lines) > 1, "Export has no data rows (only header or empty)"
        print(f"✅ Export has {len(lines)-1} data rows")


class TestBundleImportCSV:
    """Test POST /api/admin/bundles/all/import-csv"""

    def test_import_bundles_csv_returns_200(self):
        payload = [
            {
                "name": "TEST_Import_Bundle_CSV",
                "pillar": "care",
                "price": 250,
                "is_active": True,
                "is_soul_made": False,
                "description": "Imported by test",
                "category": "wellness",
                "items": "item1;item2",
                "tags": ["test"],
                "approval_status": "live",
                "paw_points_eligible": False,
                "paw_points_value": 0,
                "mira_hint": "Great for pups",
            }
        ]
        res = requests.post(
            f"{BASE_URL}/api/admin/bundles/all/import-csv",
            json=payload,
            headers=HEADERS
        )
        assert res.status_code == 200, f"Import failed: {res.status_code} {res.text}"
        data = res.json()
        assert "imported" in data, f"Missing 'imported' key: {data}"
        assert data["imported"] >= 1, f"Expected >=1, got: {data['imported']}"
        print(f"✅ Bundles imported: {data['imported']}")


class TestBundleGetAll:
    """Test GET /api/admin/bundles/all"""

    def test_get_all_bundles_returns_200(self):
        res = requests.get(f"{BASE_URL}/api/admin/bundles/all", headers=HEADERS)
        assert res.status_code == 200, f"Expected 200, got {res.status_code}"
        data = res.json()
        assert "bundles" in data, f"Missing 'bundles' key: {data}"
        assert isinstance(data["bundles"], list)
        print(f"✅ Fetched {len(data['bundles'])} bundles")

    def test_get_bundles_with_pillar_filter(self):
        res = requests.get(f"{BASE_URL}/api/admin/bundles/all?pillar=care", headers=HEADERS)
        assert res.status_code == 200
        data = res.json()
        bundles = data.get("bundles", [])
        if bundles:
            for b in bundles:
                assert b.get("pillar") == "care", f"Found non-care bundle: {b.get('pillar')}"
        print(f"✅ Pillar filter works, got {len(bundles)} care bundles")
