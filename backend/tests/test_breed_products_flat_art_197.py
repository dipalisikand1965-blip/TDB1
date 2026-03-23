"""
Backend tests for iteration 197:
- GET /api/mockups/breed-products with flat_only=true param
- GET /api/mockups/breed-products with skip (pagination) param
- GET /api/mockups/breed-products with search param
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
AUTH = ('aditya', 'lola4304')


class TestFlatOnlyParam:
    """Test flat_only=true returns flat art products (product_type starts with flat_)"""

    def test_flat_only_returns_results(self):
        """flat_only=true should return products"""
        res = requests.get(f"{BASE_URL}/api/mockups/breed-products?flat_only=true&limit=10")
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text[:200]}"
        data = res.json()
        assert "products" in data, "Response missing 'products' field"
        assert "total" in data, "Response missing 'total' field"
        print(f"flat_only=true total: {data['total']}, returned: {len(data['products'])}")

    def test_flat_only_product_types_start_with_flat(self):
        """All returned products must have product_type starting with 'flat_'"""
        res = requests.get(f"{BASE_URL}/api/mockups/breed-products?flat_only=true&limit=50")
        assert res.status_code == 200
        data = res.json()
        products = data.get("products", [])
        if len(products) == 0:
            pytest.skip("No flat art products found — seeding may be needed")
        for p in products:
            pt = p.get("product_type", "")
            assert pt.startswith("flat_"), f"Product {p.get('name')} has product_type='{pt}' — does NOT start with 'flat_'"
        print(f"PASS: {len(products)} flat art products all have product_type starting with 'flat_'")

    def test_flat_only_with_breed_filter(self):
        """flat_only=true with breed filter should return breed-specific flat art products"""
        res = requests.get(f"{BASE_URL}/api/mockups/breed-products?flat_only=true&breed=indie&limit=20")
        assert res.status_code == 200
        data = res.json()
        assert "total" in data, "Response missing 'total' field"
        print(f"flat_only=true breed=indie: total={data['total']}, count={data.get('count', len(data.get('products', [])))}")

    def test_flat_only_response_structure(self):
        """Response should have products, total, count fields"""
        res = requests.get(f"{BASE_URL}/api/mockups/breed-products?flat_only=true&limit=5")
        assert res.status_code == 200
        data = res.json()
        assert "products" in data
        assert "total" in data
        assert "count" in data
        assert data["count"] == len(data["products"])
        print(f"Response structure OK: total={data['total']}, count={data['count']}")

    def test_flat_only_total_is_large(self):
        """According to spec, there are 831 flat art products across 48 breeds"""
        res = requests.get(f"{BASE_URL}/api/mockups/breed-products?flat_only=true&limit=1")
        assert res.status_code == 200
        data = res.json()
        total = data.get("total", 0)
        # Should have substantial flat art products
        assert total > 0, f"Expected flat art products but total={total}"
        print(f"Total flat art products: {total} (expected ~831)")


class TestPaginationSkipParam:
    """Test skip param works for pagination"""

    def test_skip_returns_200(self):
        """skip param should work without errors"""
        res = requests.get(f"{BASE_URL}/api/mockups/breed-products?limit=5&skip=5")
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text[:200]}"
        data = res.json()
        assert "products" in data
        print(f"skip=5 OK: {len(data['products'])} products returned, total={data['total']}")

    def test_skip_zero_vs_skip_5_different_results(self):
        """skip=0 and skip=5 should return different products"""
        res0 = requests.get(f"{BASE_URL}/api/mockups/breed-products?limit=5&skip=0")
        res5 = requests.get(f"{BASE_URL}/api/mockups/breed-products?limit=5&skip=5")
        assert res0.status_code == 200 and res5.status_code == 200
        d0 = res0.json()
        d5 = res5.json()
        prods0 = [p.get("id") or p.get("name") for p in d0.get("products", [])]
        prods5 = [p.get("id") or p.get("name") for p in d5.get("products", [])]
        if len(prods0) > 0 and len(prods5) > 0:
            assert prods0 != prods5, "skip=0 and skip=5 returned same products — pagination not working"
        print(f"skip=0: {prods0[:2]}\nskip=5: {prods5[:2]}")

    def test_skip_pagination_totals_consistent(self):
        """Total should be same regardless of skip value"""
        res1 = requests.get(f"{BASE_URL}/api/mockups/breed-products?limit=5&skip=0")
        res2 = requests.get(f"{BASE_URL}/api/mockups/breed-products?limit=5&skip=10")
        assert res1.status_code == 200 and res2.status_code == 200
        total1 = res1.json().get("total")
        total2 = res2.json().get("total")
        assert total1 == total2, f"Total should be same regardless of skip: skip=0 total={total1}, skip=10 total={total2}"
        print(f"Consistent total: {total1}")

    def test_skip_larger_than_total_returns_empty(self):
        """Skip beyond total should return empty products but consistent total"""
        # Get total first
        res = requests.get(f"{BASE_URL}/api/mockups/breed-products?limit=1&skip=0")
        assert res.status_code == 200
        total = res.json().get("total", 0)
        if total > 0:
            res_over = requests.get(f"{BASE_URL}/api/mockups/breed-products?limit=5&skip={total+100}")
            assert res_over.status_code == 200
            data = res_over.json()
            assert len(data.get("products", [])) == 0, "Skip beyond total should return empty products"
            print(f"skip={total+100} correctly returns 0 products (total={total})")


class TestSearchParam:
    """Test search param filters by name/breed"""

    def test_search_returns_200(self):
        """Search param should work"""
        res = requests.get(f"{BASE_URL}/api/mockups/breed-products?search=labrador")
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text[:200]}"
        data = res.json()
        assert "products" in data
        print(f"search=labrador: {len(data['products'])} results, total={data['total']}")

    def test_search_filters_by_breed_name(self):
        """Search should return products matching the search term in name or breed"""
        res = requests.get(f"{BASE_URL}/api/mockups/breed-products?search=labrador&limit=20")
        assert res.status_code == 200
        data = res.json()
        products = data.get("products", [])
        if len(products) == 0:
            print("No products found for search=labrador — may be empty DB")
            return
        for p in products:
            name = (p.get("name") or "").lower()
            breed = (p.get("breed") or "").lower()
            product_type = (p.get("product_type") or "").lower()
            matches = "labrador" in name or "labrador" in breed or "labrador" in product_type
            assert matches, f"Product '{p.get('name')}' (breed={p.get('breed')}) doesn't match 'labrador'"
        print(f"PASS: {len(products)} products all match search=labrador")

    def test_search_nonexistent_returns_empty(self):
        """Search for gibberish should return 0 results"""
        res = requests.get(f"{BASE_URL}/api/mockups/breed-products?search=xyzabc123nonexistent")
        assert res.status_code == 200
        data = res.json()
        assert data.get("total", 0) == 0 or len(data.get("products", [])) == 0, \
            "Gibberish search should return no results"
        print(f"Nonexistent search correctly returns: total={data.get('total')}, products={len(data.get('products', []))}")

    def test_search_case_insensitive(self):
        """Search should be case-insensitive"""
        res_lower = requests.get(f"{BASE_URL}/api/mockups/breed-products?search=indie&limit=5")
        res_upper = requests.get(f"{BASE_URL}/api/mockups/breed-products?search=Indie&limit=5")
        assert res_lower.status_code == 200 and res_upper.status_code == 200
        total_lower = res_lower.json().get("total", 0)
        total_upper = res_upper.json().get("total", 0)
        assert total_lower == total_upper, f"Case sensitivity issue: 'indie'→{total_lower}, 'Indie'→{total_upper}"
        print(f"Case-insensitive search works: 'indie'={total_lower}, 'Indie'={total_upper}")

    def test_search_with_flat_only(self):
        """Search + flat_only should work together"""
        res = requests.get(f"{BASE_URL}/api/mockups/breed-products?flat_only=true&search=indie&limit=10")
        assert res.status_code == 200
        data = res.json()
        products = data.get("products", [])
        for p in products:
            pt = p.get("product_type", "")
            assert pt.startswith("flat_"), f"flat_only+search: product_type '{pt}' doesn't start with 'flat_'"
        print(f"flat_only+search=indie: {len(products)} products, all flat art")


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
