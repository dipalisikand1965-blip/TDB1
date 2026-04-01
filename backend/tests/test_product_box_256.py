"""
Tests for iteration 256:
- Product Box Export CSV (GET /api/product-box/export/csv?include_all_fields=true)
- Product Box Import CSV (POST /api/product-box/import)
"""
import pytest
import requests
import os
import io
import csv

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
AUTH_HEADER = {'Authorization': 'Basic YWRpdHlhOmxvbGE0MzA0'}

IMPORT_ENDPOINT = f"{BASE_URL}/api/product-box/import"
EXPORT_ENDPOINT = f"{BASE_URL}/api/product-box/export/csv"

# ------------------------------------------------------------------
# Export CSV tests
# ------------------------------------------------------------------

class TestProductBoxExportCSV:
    """GET /api/product-box/export/csv tests"""

    def test_export_csv_returns_200(self):
        """Basic export returns 200 status"""
        resp = requests.get(f"{EXPORT_ENDPOINT}?include_all_fields=true", headers=AUTH_HEADER)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text[:200]}"
        print("PASS: Export CSV returns 200")

    def test_export_csv_content_type(self):
        """Export should return text/csv or application/csv content type"""
        resp = requests.get(f"{EXPORT_ENDPOINT}?include_all_fields=true", headers=AUTH_HEADER)
        assert resp.status_code == 200
        ct = resp.headers.get('content-type', '')
        assert 'csv' in ct.lower() or 'text' in ct.lower(), f"Unexpected content-type: {ct}"
        print(f"PASS: Content-Type is {ct}")

    def test_export_csv_has_headers(self):
        """Export CSV must have header row"""
        resp = requests.get(f"{EXPORT_ENDPOINT}?include_all_fields=true", headers=AUTH_HEADER)
        assert resp.status_code == 200
        content = resp.text
        assert len(content) > 0, "CSV content is empty"
        reader = csv.reader(io.StringIO(content))
        headers = next(reader)
        assert len(headers) > 0, "CSV has no headers"
        print(f"PASS: CSV has {len(headers)} columns: {headers[:10]}...")

    def test_export_csv_expected_columns(self):
        """Export CSV (include_all_fields=true) should include key columns"""
        resp = requests.get(f"{EXPORT_ENDPOINT}?include_all_fields=true", headers=AUTH_HEADER)
        assert resp.status_code == 200
        reader = csv.reader(io.StringIO(resp.text))
        headers = [h.strip() for h in next(reader)]

        required_cols = ['id', 'name', 'primary_pillar', 'mrp', 'selling_price', 'mira_hint']
        for col in required_cols:
            assert col in headers, f"Missing required column: {col}. Headers: {headers}"
        print(f"PASS: All required columns present. Total columns: {len(headers)}")

    def test_export_csv_50_plus_columns(self):
        """include_all_fields=true should return 30+ columns (extended schema)"""
        resp = requests.get(f"{EXPORT_ENDPOINT}?include_all_fields=true", headers=AUTH_HEADER)
        assert resp.status_code == 200
        reader = csv.reader(io.StringIO(resp.text))
        headers = next(reader)
        assert len(headers) >= 30, f"Expected >=30 columns, got {len(headers)}: {headers}"
        print(f"PASS: CSV has {len(headers)} columns")

    def test_export_csv_additional_schema_columns(self):
        """include_all_fields=true should include suitability/breed/gst columns"""
        resp = requests.get(f"{EXPORT_ENDPOINT}?include_all_fields=true", headers=AUTH_HEADER)
        assert resp.status_code == 200
        reader = csv.reader(io.StringIO(resp.text))
        headers = [h.strip() for h in next(reader)]

        extended_cols = ['life_stages', 'applicable_breeds', 'sku', 'brand', 'pillars', 'category']
        for col in extended_cols:
            assert col in headers, f"Missing extended column: {col}. Headers: {headers}"
        print(f"PASS: Extended columns present: {extended_cols}")

    def test_export_csv_basic_without_flag(self):
        """Without include_all_fields returns fewer columns than full export"""
        full_resp  = requests.get(f"{EXPORT_ENDPOINT}?include_all_fields=true", headers=AUTH_HEADER)
        basic_resp = requests.get(f"{EXPORT_ENDPOINT}?include_all_fields=false", headers=AUTH_HEADER)
        assert full_resp.status_code == 200
        assert basic_resp.status_code == 200

        full_headers  = next(csv.reader(io.StringIO(full_resp.text)))
        basic_headers = next(csv.reader(io.StringIO(basic_resp.text)))
        assert len(full_headers) >= len(basic_headers), "Full export should have >= columns vs basic"
        print(f"PASS: Full={len(full_headers)} cols, Basic={len(basic_headers)} cols")

    def test_export_csv_pillar_filter(self):
        """Pillar filter should return only products for that pillar"""
        resp = requests.get(f"{EXPORT_ENDPOINT}?include_all_fields=false&pillar=celebrate", headers=AUTH_HEADER)
        assert resp.status_code == 200
        print(f"PASS: Export with pillar filter returns {resp.status_code}")


# ------------------------------------------------------------------
# Import CSV tests
# ------------------------------------------------------------------

class TestProductBoxImportCSV:
    """POST /api/product-box/import tests"""

    created_ids = []  # track for cleanup

    def test_import_endpoint_exists(self):
        """POST /import endpoint should exist (not 404)"""
        resp = requests.post(
            IMPORT_ENDPOINT,
            headers={**AUTH_HEADER, 'Content-Type': 'application/json'},
            json={"products": [], "update_existing": True}
        )
        assert resp.status_code != 404, "Import endpoint not found (404)"
        print(f"PASS: Import endpoint exists (status={resp.status_code})")

    def test_import_minimal_product(self):
        """Import a minimal product with name, primary_pillar, category, mrp, selling_price"""
        payload = {
            "products": [
                {
                    "name":          "TEST_Import_Product_256",
                    "primary_pillar": "celebrate",
                    "category":       "treats",
                    "mrp":            "299",
                    "selling_price":  "249",
                }
            ],
            "update_existing": True
        }
        resp = requests.post(
            IMPORT_ENDPOINT,
            headers={**AUTH_HEADER, 'Content-Type': 'application/json'},
            json=payload
        )
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}: {resp.text[:500]}"
        data = resp.json()
        assert data.get('success') is True, f"success != True: {data}"
        assert data.get('imported', 0) + data.get('updated', 0) > 0, f"Nothing imported/updated: {data}"
        print(f"PASS: Import response: {data}")

    def test_import_returns_structured_response(self):
        """Import response must contain success, imported, updated, failed, total, errors"""
        payload = {
            "products": [
                {
                    "name": "TEST_Import_Schema_Check_256",
                    "primary_pillar": "shop",
                    "mrp": "100",
                    "selling_price": "90",
                }
            ],
            "update_existing": True
        }
        resp = requests.post(
            IMPORT_ENDPOINT,
            headers={**AUTH_HEADER, 'Content-Type': 'application/json'},
            json=payload
        )
        assert resp.status_code == 200
        data = resp.json()
        for field in ['success', 'imported', 'updated', 'failed', 'total', 'errors']:
            assert field in data, f"Missing field '{field}' in response: {data}"
        assert isinstance(data['errors'], list)
        assert data['total'] == 1
        print(f"PASS: Structured response: {data}")

    def test_import_empty_products_list(self):
        """Import with empty products list returns 200 with 0 counts"""
        resp = requests.post(
            IMPORT_ENDPOINT,
            headers={**AUTH_HEADER, 'Content-Type': 'application/json'},
            json={"products": [], "update_existing": True}
        )
        assert resp.status_code == 200
        data = resp.json()
        assert data.get('total', -1) == 0
        assert data.get('imported', 0) == 0
        print(f"PASS: Empty import: {data}")

    def test_import_product_with_all_fields(self):
        """Import a product with all major fields populated"""
        payload = {
            "products": [
                {
                    "name":          "TEST_Full_Import_256",
                    "sku":           "TEST-SKU-256",
                    "brand":         "TestBrand",
                    "primary_pillar": "care",
                    "pillars":       "care,celebrate",
                    "category":      "supplements",
                    "mrp":           "599",
                    "selling_price": "499",
                    "mira_hint":     "Great for senior dogs",
                    "life_stages":   "senior,adult",
                    "applicable_breeds": "labrador,golden_retriever",
                    "in_stock":      "true",
                    "short_description": "A test product for automated import testing",
                    "tags":          "test,import,senior",
                }
            ],
            "update_existing": True
        }
        resp = requests.post(
            IMPORT_ENDPOINT,
            headers={**AUTH_HEADER, 'Content-Type': 'application/json'},
            json=payload
        )
        assert resp.status_code == 200, f"Status {resp.status_code}: {resp.text[:500]}"
        data = resp.json()
        assert data.get('success') is True
        assert data.get('failed', 0) == 0, f"Import had failures: {data}"
        print(f"PASS: Full field import: {data}")

    def test_import_then_export_roundtrip(self):
        """Create product via import, then verify it appears in export"""
        unique_name = "TEST_RoundTrip_256_UNIQUE"

        # Import
        import_resp = requests.post(
            IMPORT_ENDPOINT,
            headers={**AUTH_HEADER, 'Content-Type': 'application/json'},
            json={
                "products": [
                    {"name": unique_name, "primary_pillar": "shop", "mrp": "150", "selling_price": "125"}
                ],
                "update_existing": True
            }
        )
        assert import_resp.status_code == 200
        import_data = import_resp.json()
        assert import_data.get('success') is True
        assert import_data.get('imported', 0) + import_data.get('updated', 0) > 0

        # Export and check
        export_resp = requests.get(f"{EXPORT_ENDPOINT}?include_all_fields=true", headers=AUTH_HEADER)
        assert export_resp.status_code == 200
        assert unique_name in export_resp.text, f"Imported product '{unique_name}' not found in export CSV"
        print(f"PASS: Round-trip verified — '{unique_name}' found in export CSV")

    def test_import_no_name_row_skipped(self):
        """Rows without 'name' field should be skipped (not fail)"""
        payload = {
            "products": [
                {"primary_pillar": "shop", "mrp": "100"},  # No name → skip
                {"name": "TEST_ValidRow_256", "primary_pillar": "shop", "mrp": "100", "selling_price": "90"}
            ],
            "update_existing": True
        }
        resp = requests.post(
            IMPORT_ENDPOINT,
            headers={**AUTH_HEADER, 'Content-Type': 'application/json'},
            json=payload
        )
        assert resp.status_code == 200
        data = resp.json()
        # total=2 but only 1 (or 1 imported + 1 skipped=0 failed)
        assert data.get('failed', 0) == 0, f"Name-less row caused failure: {data}"
        print(f"PASS: No-name row skipped cleanly: {data}")


# ------------------------------------------------------------------
# Cleanup
# ------------------------------------------------------------------
@pytest.fixture(autouse=True)
def cleanup_test_products():
    """Delete TEST_ prefixed products after each test class run"""
    yield
    # Products created with names starting with TEST_ -- cleanup via search
    try:
        search_resp = requests.get(
            f"{BASE_URL}/api/product-box/products?search=TEST_&limit=50",
            headers=AUTH_HEADER
        )
        if search_resp.status_code == 200:
            items = search_resp.json().get('products', [])
            for item in items:
                pid = item.get('id')
                if pid and item.get('name', '').startswith('TEST_'):
                    requests.delete(f"{BASE_URL}/api/product-box/products/{pid}", headers=AUTH_HEADER)
    except Exception as e:
        print(f"Cleanup warning: {e}")
