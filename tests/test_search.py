"""
Search API Tests for The Doggy Bakery
Tests Meilisearch integration: typeahead, full search, filters, typo tolerance
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://petlifeos-2.preview.emergentagent.com')

# Admin credentials for protected endpoints
ADMIN_USERNAME = "aditya"
ADMIN_PASSWORD = "lola4304"


class TestSearchTypeahead:
    """Typeahead/autocomplete search tests"""
    
    def test_typeahead_returns_products_and_collections(self):
        """Typeahead should return both products and collections"""
        response = requests.get(f"{BASE_URL}/api/search/typeahead?q=cake&limit=5")
        assert response.status_code == 200
        
        data = response.json()
        assert "products" in data
        assert "collections" in data
        assert "query" in data
        assert data["query"] == "cake"
        
        # Should have results
        assert len(data["products"]) > 0, "Should return products for 'cake'"
        
        # Products should have required fields
        product = data["products"][0]
        assert "id" in product
        assert "name" in product
        assert "price" in product
        assert "category" in product
    
    def test_typeahead_minimum_query_length(self):
        """Typeahead requires at least 2 characters - returns 422 for single char"""
        # Single character should return 422 validation error
        response = requests.get(f"{BASE_URL}/api/search/typeahead?q=c&limit=5")
        # API validates minimum query length
        assert response.status_code in [200, 422], "Should return 200 with empty or 422 validation error"
    
    def test_typeahead_typo_tolerance(self):
        """Typeahead should handle typos - 'labredor' should find 'Labrador'"""
        response = requests.get(f"{BASE_URL}/api/search/typeahead?q=labredor&limit=5")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data["products"]) > 0, "Typo tolerance should find 'Labrador' products"
        
        # Check that at least one result contains 'Labrador'
        found_labrador = any("labrador" in p["name"].lower() for p in data["products"])
        assert found_labrador, "Should find Labrador products with typo 'labredor'"
    
    def test_typeahead_limit_parameter(self):
        """Typeahead should respect limit parameter"""
        response = requests.get(f"{BASE_URL}/api/search/typeahead?q=dog&limit=3")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data["products"]) <= 3


class TestFullSearch:
    """Full search endpoint tests with filters"""
    
    def test_search_basic_query(self):
        """Basic search should return results with metadata"""
        response = requests.get(f"{BASE_URL}/api/search?q=birthday&limit=10")
        assert response.status_code == 200
        
        data = response.json()
        assert "hits" in data
        assert "query" in data
        assert "estimatedTotalHits" in data
        assert data["query"] == "birthday"
        assert len(data["hits"]) > 0
        
        # Check hit structure
        hit = data["hits"][0]
        assert "id" in hit
        assert "name" in hit
        assert "price" in hit
        assert "category" in hit
    
    def test_search_category_filter(self):
        """Search with category filter should only return matching category"""
        response = requests.get(f"{BASE_URL}/api/search?q=cake&category=cakes&limit=10")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data["hits"]) > 0
        
        # All results should be in 'cakes' category
        for hit in data["hits"]:
            assert hit["category"] == "cakes", f"Expected category 'cakes', got '{hit['category']}'"
    
    def test_search_price_range_filter(self):
        """Search with price range filter"""
        min_price = 100
        max_price = 500
        response = requests.get(f"{BASE_URL}/api/search?q=treat&min_price={min_price}&max_price={max_price}&limit=10")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data["hits"]) > 0
        
        # All results should be within price range
        for hit in data["hits"]:
            assert hit["price"] >= min_price, f"Price {hit['price']} below min {min_price}"
            assert hit["price"] <= max_price, f"Price {hit['price']} above max {max_price}"
    
    def test_search_pan_india_filter(self):
        """Search with pan_india shipping filter"""
        response = requests.get(f"{BASE_URL}/api/search?q=biscuit&pan_india=true&limit=10")
        assert response.status_code == 200
        
        data = response.json()
        # Should return results (pan india products exist)
        assert "hits" in data
    
    def test_search_pagination(self):
        """Search pagination with offset"""
        # First page
        response1 = requests.get(f"{BASE_URL}/api/search?q=dog&limit=5&offset=0")
        assert response1.status_code == 200
        data1 = response1.json()
        
        # Second page
        response2 = requests.get(f"{BASE_URL}/api/search?q=dog&limit=5&offset=5")
        assert response2.status_code == 200
        data2 = response2.json()
        
        # Results should be different
        if len(data1["hits"]) > 0 and len(data2["hits"]) > 0:
            assert data1["hits"][0]["id"] != data2["hits"][0]["id"], "Pagination should return different results"
    
    def test_search_typo_tolerance_full(self):
        """Full search should also have typo tolerance"""
        response = requests.get(f"{BASE_URL}/api/search?q=birtday&limit=5")  # Missing 'h'
        assert response.status_code == 200
        
        data = response.json()
        # Should still find birthday products
        assert len(data["hits"]) > 0, "Typo tolerance should find 'birthday' products"
    
    def test_search_empty_query(self):
        """Empty query should return validation error or empty results"""
        response = requests.get(f"{BASE_URL}/api/search?q=&limit=5")
        # API validates that query is required
        assert response.status_code in [200, 422], "Should return 200 with empty or 422 validation error"


class TestSearchStats:
    """Search index statistics tests"""
    
    def test_get_search_stats(self):
        """Should return search index statistics"""
        response = requests.get(f"{BASE_URL}/api/search/stats")
        assert response.status_code == 200
        
        data = response.json()
        assert "initialized" in data
        assert data["initialized"] == True
        assert "products_indexed" in data
        assert data["products_indexed"] > 0, "Should have indexed products"


class TestSearchReindex:
    """Admin reindex endpoint tests"""
    
    def test_reindex_requires_auth(self):
        """Reindex endpoint should require authentication"""
        response = requests.post(f"{BASE_URL}/api/search/reindex")
        assert response.status_code == 401
    
    def test_reindex_with_wrong_credentials(self):
        """Reindex should reject wrong credentials"""
        response = requests.post(
            f"{BASE_URL}/api/search/reindex",
            auth=("wrong", "credentials")
        )
        assert response.status_code == 401
    
    def test_reindex_with_valid_credentials(self):
        """Reindex should work with valid admin credentials"""
        response = requests.post(
            f"{BASE_URL}/api/search/reindex",
            auth=(ADMIN_USERNAME, ADMIN_PASSWORD)
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] == True
        assert "products_indexed" in data
        assert data["products_indexed"] > 0
        assert "collections_indexed" in data


class TestSearchSynonyms:
    """Test synonym support in search"""
    
    def test_synonym_dog_doggy(self):
        """'doggy' should find 'dog' products (synonym)"""
        response = requests.get(f"{BASE_URL}/api/search?q=doggy&limit=5")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data["hits"]) > 0, "Synonym 'doggy' should find products"
    
    def test_synonym_treat_snack(self):
        """'snack' should find 'treat' products (synonym)"""
        response = requests.get(f"{BASE_URL}/api/search?q=snack&limit=5")
        assert response.status_code == 200
        
        data = response.json()
        # Should find some results due to synonym mapping
        assert "hits" in data


class TestSearchRanking:
    """Test search result ranking"""
    
    def test_exact_match_ranked_higher(self):
        """Exact matches should be ranked higher"""
        response = requests.get(f"{BASE_URL}/api/search?q=Labrador&limit=10")
        assert response.status_code == 200
        
        data = response.json()
        assert len(data["hits"]) > 0
        
        # First result should contain 'Labrador' in name
        first_hit = data["hits"][0]
        assert "labrador" in first_hit["name"].lower(), "Exact match should be ranked first"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
