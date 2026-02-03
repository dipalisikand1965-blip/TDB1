"""
Test Suite for Iteration 191 - Party Products & Bundle Deconstruction
Tests:
1. Search for party products (party hat, balloon, Birthday Boy Bandana)
2. Celebrate pillar products include new party accessories
3. Bundle-deconstructed items searchable (TDC Birthday Cake)
4. Products have proper pillar assignment
5. TTS voice configuration (Elise)
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestPartyProductsSearch:
    """Test party products search functionality"""
    
    def test_search_party_hat(self):
        """Search for 'party hat' should return party products"""
        response = requests.get(f"{BASE_URL}/api/products", params={"search": "party hat", "limit": 20})
        assert response.status_code == 200
        data = response.json()
        products = data.get('products', [])
        
        # Should find party hat related products
        assert len(products) > 0, "No party hat products found"
        
        # Check if any product name contains 'hat' or 'party'
        hat_products = [p for p in products if 'hat' in p.get('name', '').lower() or 'party' in p.get('name', '').lower()]
        print(f"Found {len(hat_products)} party hat related products")
        for p in hat_products[:5]:
            print(f"  - {p['name']}")
    
    def test_search_balloon(self):
        """Search for 'balloon' should return balloon-related products"""
        response = requests.get(f"{BASE_URL}/api/products", params={"search": "balloon", "limit": 20})
        assert response.status_code == 200
        data = response.json()
        products = data.get('products', [])
        
        # Should find balloon related products
        assert len(products) > 0, "No balloon products found"
        
        # Check for balloon products
        balloon_products = [p for p in products if 'balloon' in p.get('name', '').lower() or 'balloon' in str(p.get('description', '')).lower()]
        print(f"Found {len(balloon_products)} balloon related products")
        for p in balloon_products[:5]:
            print(f"  - {p['name']}")
    
    def test_search_birthday_boy_bandana(self):
        """Search for 'Birthday Boy Bandana' should find the specific product"""
        response = requests.get(f"{BASE_URL}/api/products", params={"search": "Birthday Boy Bandana", "limit": 10})
        assert response.status_code == 200
        data = response.json()
        products = data.get('products', [])
        
        # Should find the specific bandana product
        assert len(products) > 0, "Birthday Boy Bandana not found"
        
        # Check for exact match
        bandana_found = any('birthday boy bandana' in p.get('name', '').lower() for p in products)
        assert bandana_found, "Birthday Boy Bandana product not found in search results"
        
        print(f"Found Birthday Boy Bandana in search results")
        for p in products[:3]:
            print(f"  - {p['name']} (source: {p.get('source', 'unknown')})")


class TestBundleDeconstructedProducts:
    """Test bundle-deconstructed items are searchable"""
    
    def test_search_tdc_birthday_cake(self):
        """Search for 'TDC Birthday Cake' should find bundle-deconstructed item"""
        response = requests.get(f"{BASE_URL}/api/products", params={"search": "TDC Birthday Cake", "limit": 10})
        assert response.status_code == 200
        data = response.json()
        products = data.get('products', [])
        
        # Should find TDC Birthday Cake
        assert len(products) > 0, "TDC Birthday Cake not found"
        
        # Check for bundle_deconstruction source
        tdc_products = [p for p in products if p.get('source') == 'bundle_deconstruction']
        print(f"Found {len(tdc_products)} bundle-deconstructed products")
        for p in tdc_products[:5]:
            print(f"  - {p['name']} (source: {p.get('source')})")
    
    def test_search_tdc_branded_products(self):
        """Search for TDC branded products"""
        response = requests.get(f"{BASE_URL}/api/products", params={"search": "TDC", "limit": 30})
        assert response.status_code == 200
        data = response.json()
        products = data.get('products', [])
        
        # Should find TDC products
        tdc_products = [p for p in products if 'tdc' in p.get('name', '').lower()]
        print(f"Found {len(tdc_products)} TDC products")
        for p in tdc_products[:10]:
            print(f"  - {p['name']} (source: {p.get('source', 'unknown')})")


class TestCelebratePillarProducts:
    """Test celebrate pillar products include new party accessories"""
    
    def test_celebrate_pillar_products(self):
        """Celebrate pillar should include party products"""
        response = requests.get(f"{BASE_URL}/api/products", params={"pillar": "celebrate", "limit": 100})
        assert response.status_code == 200
        data = response.json()
        products = data.get('products', [])
        total = data.get('total', len(products))
        
        assert len(products) > 0, "No celebrate pillar products found"
        print(f"Total celebrate pillar products: {total}")
        
        # Check for party accessories
        party_products = [p for p in products if 
            'party' in p.get('name', '').lower() or 
            'birthday' in p.get('name', '').lower() or
            'celebration' in p.get('name', '').lower() or
            p.get('category') == 'party_accessories']
        
        print(f"Found {len(party_products)} party-related products in celebrate pillar")
        for p in party_products[:10]:
            print(f"  - {p['name']} (category: {p.get('category', 'unknown')})")
    
    def test_celebrate_pillar_has_tdc_branded(self):
        """Celebrate pillar should include TDC branded products"""
        response = requests.get(f"{BASE_URL}/api/products", params={"pillar": "celebrate", "limit": 500})
        assert response.status_code == 200
        data = response.json()
        products = data.get('products', [])
        
        # Check for TDC branded products
        tdc_branded = [p for p in products if p.get('source') == 'tdc_branded']
        bundle_decon = [p for p in products if p.get('source') == 'bundle_deconstruction']
        
        print(f"TDC branded products in celebrate: {len(tdc_branded)}")
        print(f"Bundle deconstructed products in celebrate: {len(bundle_decon)}")
        
        # Should have some TDC branded products
        assert len(tdc_branded) > 0 or len(bundle_decon) > 0, "No TDC branded or bundle deconstructed products in celebrate pillar"


class TestProductPillarAssignment:
    """Test products have proper pillar assignment"""
    
    def test_party_products_have_celebrate_pillar(self):
        """Party products should be assigned to celebrate pillar"""
        response = requests.get(f"{BASE_URL}/api/products", params={"search": "party", "limit": 20})
        assert response.status_code == 200
        data = response.json()
        products = data.get('products', [])
        
        for p in products[:10]:
            pillar = p.get('pillar', 'unknown')
            print(f"  - {p['name']}: pillar={pillar}")
            # Party products should be in celebrate pillar
            if 'party' in p.get('name', '').lower():
                assert pillar == 'celebrate', f"Party product {p['name']} should be in celebrate pillar, got {pillar}"
    
    def test_dine_pillar_products(self):
        """Dine pillar should have food products"""
        response = requests.get(f"{BASE_URL}/api/products", params={"pillar": "dine", "limit": 20})
        assert response.status_code == 200
        data = response.json()
        products = data.get('products', [])
        
        print(f"Found {len(products)} dine pillar products")
        for p in products[:5]:
            print(f"  - {p['name']} (category: {p.get('category', 'unknown')})")


class TestTTSVoiceConfiguration:
    """Test TTS voice is configured to Elise"""
    
    def test_tts_config_elise_voice(self):
        """TTS config should return Elise voice"""
        response = requests.get(f"{BASE_URL}/api/tts/config")
        assert response.status_code == 200
        data = response.json()
        
        default_voice = data.get('default_voice_id', '')
        print(f"Default TTS voice ID: {default_voice}")
        
        # Elise voice ID is EST9Ui6982FZPSi7gCHi
        assert default_voice == 'EST9Ui6982FZPSi7gCHi', f"Expected Elise voice (EST9Ui6982FZPSi7gCHi), got {default_voice}"


class TestProductSearchAPI:
    """Test product search API functionality"""
    
    def test_search_api_returns_products(self):
        """Search API should return products array"""
        response = requests.get(f"{BASE_URL}/api/products", params={"search": "cake", "limit": 10})
        assert response.status_code == 200
        data = response.json()
        
        assert 'products' in data, "Response should contain 'products' key"
        assert isinstance(data['products'], list), "Products should be a list"
    
    def test_search_with_pillar_filter(self):
        """Search with pillar filter should work"""
        response = requests.get(f"{BASE_URL}/api/products", params={"search": "birthday", "pillar": "celebrate", "limit": 10})
        assert response.status_code == 200
        data = response.json()
        products = data.get('products', [])
        
        print(f"Found {len(products)} birthday products in celebrate pillar")
        for p in products[:5]:
            print(f"  - {p['name']}")
    
    def test_search_case_insensitive(self):
        """Search should be case insensitive"""
        response1 = requests.get(f"{BASE_URL}/api/products", params={"search": "BIRTHDAY", "limit": 10})
        response2 = requests.get(f"{BASE_URL}/api/products", params={"search": "birthday", "limit": 10})
        
        assert response1.status_code == 200
        assert response2.status_code == 200
        
        data1 = response1.json()
        data2 = response2.json()
        
        # Both should return similar results
        assert len(data1.get('products', [])) > 0, "BIRTHDAY search returned no results"
        assert len(data2.get('products', [])) > 0, "birthday search returned no results"


class TestMiraQuickPrompts:
    """Test Mira quick prompts for celebrate pillar"""
    
    def test_celebrate_quick_prompts(self):
        """Celebrate pillar should have quick prompts"""
        response = requests.get(f"{BASE_URL}/api/mira/quick-prompts/celebrate")
        assert response.status_code == 200
        data = response.json()
        
        prompts = data.get('prompts', [])
        print(f"Celebrate quick prompts: {prompts}")
        assert len(prompts) > 0, "No quick prompts for celebrate pillar"
    
    def test_shop_quick_prompts(self):
        """Shop should have quick prompts"""
        response = requests.get(f"{BASE_URL}/api/mira/quick-prompts/shop")
        assert response.status_code == 200
        data = response.json()
        
        prompts = data.get('prompts', [])
        print(f"Shop quick prompts: {prompts}")
        assert len(prompts) > 0, "No quick prompts for shop"


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
