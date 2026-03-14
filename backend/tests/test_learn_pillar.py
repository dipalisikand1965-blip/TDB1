"""
Test suite for LEARN Pillar APIs
Tests training programs, trainers, products, bundles, and training requests
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://pet-soul-journey.preview.emergentagent.com')


class TestLearnPrograms:
    """Tests for /api/learn/programs endpoint"""
    
    def test_get_all_programs(self):
        """Test fetching all training programs"""
        response = requests.get(f"{BASE_URL}/api/learn/programs")
        assert response.status_code == 200
        
        data = response.json()
        assert "programs" in data
        assert "count" in data
        assert len(data["programs"]) > 0
        
        # Verify program structure
        program = data["programs"][0]
        assert "id" in program
        assert "name" in program
        assert "price" in program
        assert "duration" in program
        assert "sessions" in program
    
    def test_get_featured_programs(self):
        """Test fetching featured programs only"""
        response = requests.get(f"{BASE_URL}/api/learn/programs?is_featured=true")
        assert response.status_code == 200
        
        data = response.json()
        assert "programs" in data
        # At least some programs should be featured (API may return sample data)
        featured_count = sum(1 for p in data["programs"] if p.get("is_featured") == True)
        assert featured_count > 0, "At least one featured program should exist"
    
    def test_program_has_required_fields(self):
        """Test that programs have all required fields"""
        response = requests.get(f"{BASE_URL}/api/learn/programs")
        assert response.status_code == 200
        
        data = response.json()
        required_fields = ["id", "name", "description", "duration", "sessions", "price"]
        
        for program in data["programs"]:
            for field in required_fields:
                assert field in program, f"Missing field: {field}"


class TestLearnTrainers:
    """Tests for /api/learn/trainers endpoint"""
    
    def test_get_trainers(self):
        """Test fetching trainers"""
        response = requests.get(f"{BASE_URL}/api/learn/trainers")
        assert response.status_code == 200
        
        data = response.json()
        assert "trainers" in data
        assert "count" in data
    
    def test_get_featured_trainers(self):
        """Test fetching featured trainers"""
        response = requests.get(f"{BASE_URL}/api/learn/trainers?is_featured=true")
        assert response.status_code == 200
        
        data = response.json()
        assert "trainers" in data
        assert len(data["trainers"]) > 0
        
        # Verify trainer structure
        trainer = data["trainers"][0]
        assert "id" in trainer
        assert "name" in trainer
        assert "rating" in trainer
        assert "specializations" in trainer
    
    def test_trainer_has_required_fields(self):
        """Test that trainers have all required fields"""
        response = requests.get(f"{BASE_URL}/api/learn/trainers?is_featured=true")
        assert response.status_code == 200
        
        data = response.json()
        required_fields = ["id", "name", "title", "rating", "experience_years", "city"]
        
        for trainer in data["trainers"]:
            for field in required_fields:
                assert field in trainer, f"Missing field: {field}"


class TestLearnProducts:
    """Tests for /api/learn/products endpoint"""
    
    def test_get_learn_products(self):
        """Test fetching learn-related products"""
        response = requests.get(f"{BASE_URL}/api/learn/products")
        assert response.status_code == 200
        
        data = response.json()
        assert "products" in data
        assert "count" in data
        assert len(data["products"]) > 0
    
    def test_products_have_learn_pillar(self):
        """Test that products are tagged with learn pillar"""
        response = requests.get(f"{BASE_URL}/api/learn/products")
        assert response.status_code == 200
        
        data = response.json()
        for product in data["products"]:
            assert product.get("pillar") == "learn"
    
    def test_product_has_required_fields(self):
        """Test that products have all required fields"""
        response = requests.get(f"{BASE_URL}/api/learn/products")
        assert response.status_code == 200
        
        data = response.json()
        required_fields = ["id", "name", "price", "description", "pillar"]
        
        for product in data["products"]:
            for field in required_fields:
                assert field in product, f"Missing field: {field}"


class TestLearnBundles:
    """Tests for /api/learn/bundles endpoint"""
    
    def test_get_bundles(self):
        """Test fetching training bundles"""
        response = requests.get(f"{BASE_URL}/api/learn/bundles")
        assert response.status_code == 200
        
        data = response.json()
        assert "bundles" in data
        assert "count" in data
        assert len(data["bundles"]) > 0
    
    def test_bundle_has_savings(self):
        """Test that bundles show savings"""
        response = requests.get(f"{BASE_URL}/api/learn/bundles")
        assert response.status_code == 200
        
        data = response.json()
        for bundle in data["bundles"]:
            assert "price" in bundle
            assert "original_price" in bundle
            assert "savings" in bundle
            # Savings should be positive
            assert bundle["savings"] > 0


class TestNPSTestimonials:
    """Tests for /api/concierge/nps/testimonials endpoint"""
    
    def test_get_testimonials(self):
        """Test fetching NPS testimonials"""
        response = requests.get(f"{BASE_URL}/api/concierge/nps/testimonials")
        assert response.status_code == 200
        
        data = response.json()
        assert "testimonials" in data
        assert "count" in data
        # Count should match testimonials length
        assert data["count"] == len(data["testimonials"])
    
    def test_testimonials_with_limit(self):
        """Test fetching testimonials with limit"""
        response = requests.get(f"{BASE_URL}/api/concierge/nps/testimonials?limit=5")
        assert response.status_code == 200
        
        data = response.json()
        assert "testimonials" in data
        # Should not exceed limit
        assert len(data["testimonials"]) <= 5


class TestNPSStats:
    """Tests for /api/concierge/nps/stats endpoint"""
    
    def test_get_nps_stats(self):
        """Test fetching NPS statistics"""
        response = requests.get(f"{BASE_URL}/api/concierge/nps/stats")
        assert response.status_code == 200
        
        data = response.json()
        assert "total_responses" in data
        assert "promoters" in data
        assert "passives" in data
        assert "detractors" in data


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
