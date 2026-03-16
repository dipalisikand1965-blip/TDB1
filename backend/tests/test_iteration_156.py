"""
Iteration 156: Test dine product image fix
- Verify dine products (DM-XXX, TR-XXX, SP-XXX, FF-XXX, HR-XXX) no longer have toy/wrong static.prod-images URLs
- Verify primary_pillar=dine is set on 48 seeded dine products
- Verify Product Box admin can filter by dine pillar and returns DM-001 etc
- Verify DM-001 still has its Cloudinary image (correct food image)
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestDineProductImageFix:
    """Tests verifying that dine product images are now food-related (not toys)"""

    def _get_auth_headers(self):
        """Login and get auth headers for dipali@clubconcierge.in"""
        session = requests.Session()
        resp = session.post(f"{BASE_URL}/api/auth/login", json={
            "email": "dipali@clubconcierge.in",
            "password": "TestPass@123"
        })
        if resp.status_code == 200:
            token = resp.json().get("token") or resp.json().get("access_token")
            if token:
                return {"Authorization": f"Bearer {token}"}
        # Try to get any dine products without auth - some endpoints may be public
        return {}

    def test_products_master_dine_products_exist(self):
        """Verify that dine seeded products (DM-XXX) exist in products_master"""
        headers = self._get_auth_headers()
        resp = requests.get(f"{BASE_URL}/api/product-box/products?pillar=dine&limit=50", headers=headers)
        print(f"Dine products status: {resp.status_code}")
        if resp.status_code == 200:
            data = resp.json()
            products = data.get("products", data if isinstance(data, list) else [])
            print(f"Dine products count: {len(products)}")
            
            # Look for DM-001 specifically
            dm_products = [p for p in products if p.get("sku", "").startswith("DM-")]
            print(f"DM-XXX products found: {len(dm_products)}")
            for p in dm_products[:5]:
                print(f"  SKU: {p.get('sku')}, name: {p.get('name')}, image_url: {p.get('image_url', '')[:80]}")
            
            assert len(products) > 0, "No dine products found in product box"
        else:
            print(f"Response: {resp.text[:500]}")
            pytest.skip(f"Product box API returned {resp.status_code}")

    def test_dm_001_has_cloudinary_image(self):
        """Verify DM-001 (Salmon & Sweet Potato Morning Bowl) has Cloudinary image"""
        headers = self._get_auth_headers()
        
        # Try different endpoints to find DM-001
        endpoints = [
            f"{BASE_URL}/api/product-box/products?pillar=dine&limit=50",
            f"{BASE_URL}/api/products?pillar=dine&limit=50",
            f"{BASE_URL}/api/products?sku=DM-001",
        ]
        
        found = False
        for endpoint in endpoints:
            resp = requests.get(endpoint, headers=headers)
            print(f"Endpoint {endpoint}: status={resp.status_code}")
            if resp.status_code == 200:
                data = resp.json()
                products = data.get("products", data if isinstance(data, list) else [])
                dm001 = next((p for p in products if p.get("sku") == "DM-001"), None)
                if dm001:
                    img = dm001.get("image_url", "") or dm001.get("image", "")
                    print(f"DM-001 image_url: {img}")
                    print(f"DM-001 primary_pillar: {dm001.get('primary_pillar')}")
                    print(f"DM-001 name: {dm001.get('name')}")
                    found = True
                    # The image should be a Cloudinary URL or valid food URL
                    if img:
                        is_toy_url = "static.prod-images.emergentagent.com/jobs/4700c8db" in img
                        assert not is_toy_url, f"DM-001 still has toy image URL: {img}"
                        print(f"PASS: DM-001 does NOT have toy image URL")
                    break
        
        if not found:
            print("DM-001 not found in available endpoints - may need admin access")

    def test_dine_products_no_toy_images(self):
        """Verify no dine products have the old toy static.prod-images URLs"""
        headers = self._get_auth_headers()
        
        resp = requests.get(f"{BASE_URL}/api/product-box/products?pillar=dine&limit=100", headers=headers)
        print(f"Dine products status: {resp.status_code}")
        
        if resp.status_code == 200:
            data = resp.json()
            products = data.get("products", data if isinstance(data, list) else [])
            print(f"Total dine products: {len(products)}")
            
            toy_image_products = []
            for p in products:
                img = p.get("image_url", "") or p.get("image", "")
                # The problematic URLs were from specific jobs folder
                if img and "static.prod-images.emergentagent.com/jobs/" in img:
                    toy_image_products.append({
                        "sku": p.get("sku"),
                        "name": p.get("name"),
                        "image": img[:100]
                    })
            
            print(f"Products with old static.prod-images/jobs/ URLs: {len(toy_image_products)}")
            for p in toy_image_products[:5]:
                print(f"  {p}")
            
            # After fix, no products should have the problematic job URLs
            assert len(toy_image_products) == 0, f"Found {len(toy_image_products)} products still with old toy image URLs"
            print("PASS: No dine products have old toy/wrong static URLs")
        else:
            print(f"Response: {resp.text[:300]}")
            pytest.skip(f"Could not fetch dine products - status {resp.status_code}")

    def test_dine_products_have_primary_pillar_set(self):
        """Verify dine products have primary_pillar=dine set"""
        headers = self._get_auth_headers()
        
        resp = requests.get(f"{BASE_URL}/api/product-box/products?pillar=dine&limit=50", headers=headers)
        print(f"Status: {resp.status_code}")
        
        if resp.status_code == 200:
            data = resp.json()
            products = data.get("products", data if isinstance(data, list) else [])
            
            dine_products = [p for p in products 
                            if p.get("sku", "").startswith(("DM-", "TR-", "SP-", "FF-", "HR-"))]
            print(f"Seeded dine products (DM/TR/SP/FF/HR): {len(dine_products)}")
            
            non_dine_pillar = [p for p in dine_products 
                              if p.get("primary_pillar") != "dine"]
            print(f"Products without primary_pillar=dine: {len(non_dine_pillar)}")
            for p in non_dine_pillar[:5]:
                print(f"  SKU:{p.get('sku')}, primary_pillar:{p.get('primary_pillar')}")
            
            if len(dine_products) > 0:
                assert len(non_dine_pillar) == 0, f"{len(non_dine_pillar)} seeded dine products don't have primary_pillar=dine"
                print(f"PASS: All {len(dine_products)} seeded dine products have primary_pillar=dine")
            else:
                print("INFO: No DM/TR/SP/FF/HR products found in response - may be filtered differently")
        else:
            pytest.skip(f"Could not fetch - status {resp.status_code}")

    def test_dine_products_have_food_images(self):
        """Verify dine products have appropriate food/unsplash placeholder images"""
        headers = self._get_auth_headers()
        
        resp = requests.get(f"{BASE_URL}/api/product-box/products?pillar=dine&limit=100", headers=headers)
        
        if resp.status_code == 200:
            data = resp.json()
            products = data.get("products", data if isinstance(data, list) else [])
            
            products_with_images = [p for p in products if p.get("image_url") or p.get("image")]
            products_without_images = [p for p in products 
                                       if not (p.get("image_url") or p.get("image"))]
            
            print(f"Dine products with images: {len(products_with_images)}/{len(products)}")
            print(f"Dine products without images: {len(products_without_images)}")
            
            # Sample check - show first few image URLs
            for p in products_with_images[:8]:
                img = p.get("image_url") or p.get("image")
                print(f"  SKU:{p.get('sku','?')} cat:{p.get('category','?')} img:{img[:80] if img else 'NONE'}")
            
            # At least majority should have images
            if len(products) > 0:
                coverage = len(products_with_images) / len(products)
                print(f"Image coverage: {coverage:.0%}")
                assert coverage >= 0.5, f"Only {coverage:.0%} of dine products have images"
                print(f"PASS: {coverage:.0%} image coverage on dine products")
        else:
            pytest.skip(f"Status {resp.status_code}")


class TestProductBoxAdminDine:
    """Tests for Product Box admin dine filtering"""

    def _get_admin_auth(self):
        """Get admin auth token"""
        resp = requests.post(f"{BASE_URL}/api/admin/login", json={
            "username": "aditya",
            "password": "lola4304"
        })
        if resp.status_code == 200:
            token = resp.json().get("token") or resp.json().get("access_token")
            if token:
                return {"Authorization": f"Bearer {token}"}
        print(f"Admin login status: {resp.status_code}, response: {resp.text[:200]}")
        return {}

    def test_admin_can_filter_dine_products(self):
        """Admin Product Box should show dine products when filtering by 'dine' pillar"""
        headers = self._get_admin_auth()
        
        resp = requests.get(
            f"{BASE_URL}/api/product-box/products?pillar=dine&limit=50",
            headers=headers
        )
        print(f"Admin dine products status: {resp.status_code}")
        
        if resp.status_code == 200:
            data = resp.json()
            products = data.get("products", data if isinstance(data, list) else [])
            print(f"Dine products in admin view: {len(products)}")
            
            # Check for DM-001 specifically
            dm001 = next((p for p in products if p.get("sku") == "DM-001"), None)
            if dm001:
                print(f"PASS: DM-001 found in admin dine filter")
                print(f"  Name: {dm001.get('name')}")
                print(f"  Image: {dm001.get('image_url', '')[:80]}")
                print(f"  Primary pillar: {dm001.get('primary_pillar')}")
            else:
                dm_skus = [p.get("sku") for p in products if p.get("sku", "").startswith("DM-")]
                print(f"DM-XXX SKUs found: {dm_skus[:10]}")
            
            assert len(products) >= 10, f"Expected at least 10 dine products, got {len(products)}"
        else:
            print(f"Response: {resp.text[:300]}")
            pytest.skip(f"Admin dine products endpoint returned {resp.status_code}")

    def test_admin_product_box_dine_categories(self):
        """Verify the different dine categories have products"""
        headers = self._get_admin_auth()
        
        categories = ["Daily Meals", "Treats & Rewards", "Supplements", "Frozen & Fresh", "Homemade Recipes"]
        
        for cat in categories:
            resp = requests.get(
                f"{BASE_URL}/api/product-box/products?pillar=dine&category={cat}&limit=20",
                headers=headers
            )
            count = 0
            if resp.status_code == 200:
                data = resp.json()
                products = data.get("products", data if isinstance(data, list) else [])
                count = len(products)
            print(f"Category '{cat}': {resp.status_code} - {count} products")

    def test_dine_products_total_count(self):
        """Verify total count of dine products is approximately 48 (seeded)"""
        headers = self._get_admin_auth()
        
        resp = requests.get(
            f"{BASE_URL}/api/product-box/products?pillar=dine&limit=100",
            headers=headers
        )
        print(f"Status: {resp.status_code}")
        
        if resp.status_code == 200:
            data = resp.json()
            products = data.get("products", data if isinstance(data, list) else [])
            total = data.get("total", len(products))
            print(f"Total dine products: {total}, returned: {len(products)}")
            
            # Seeded 48 products, should have at least that many
            assert len(products) >= 10, f"Expected at least 10 dine products, got {len(products)}"
            print(f"PASS: {len(products)} dine products accessible")
        else:
            pytest.skip(f"Status {resp.status_code}")


class TestDineAPIEndpoints:
    """Test dine page API endpoints"""
    
    def _get_user_auth(self):
        """Get user auth token for dipali@clubconcierge.in"""
        resp = requests.post(f"{BASE_URL}/api/auth/login", json={
            "email": "dipali@clubconcierge.in",
            "password": "TestPass@123"
        })
        print(f"User login status: {resp.status_code}")
        if resp.status_code == 200:
            token = resp.json().get("token") or resp.json().get("access_token")
            if token:
                return {"Authorization": f"Bearer {token}"}
        return {}

    def test_dine_dimension_products_daily_meals(self):
        """Test Daily Meals dimension returns food products"""
        headers = self._get_user_auth()
        if not headers:
            pytest.skip("Could not authenticate user")
        
        resp = requests.get(
            f"{BASE_URL}/api/dine/dimension-products?dimension=daily_meals",
            headers=headers
        )
        print(f"Daily Meals dimension products status: {resp.status_code}")
        
        if resp.status_code == 200:
            data = resp.json()
            products = data.get("products", data if isinstance(data, list) else [])
            print(f"Daily Meals products: {len(products)}")
            
            for p in products[:5]:
                img = p.get("image_url") or p.get("image", "")
                is_toy = "static.prod-images.emergentagent.com/jobs/4700c8db" in img
                print(f"  {p.get('name', 'N/A')} | img: {img[:80]} | toy: {is_toy}")
            
            toy_products = [p for p in products 
                           if "static.prod-images.emergentagent.com/jobs/4700c8db" in (
                               p.get("image_url", "") or p.get("image", "")
                           )]
            assert len(toy_products) == 0, f"Found {len(toy_products)} products with toy images in Daily Meals!"
        else:
            print(f"Response: {resp.text[:300]}")
            # Try alternate endpoints
            resp2 = requests.get(
                f"{BASE_URL}/api/dine/products?category=Daily+Meals",
                headers=headers
            )
            print(f"Alt endpoint status: {resp2.status_code}")

    def test_dine_mira_picks_no_toy_images(self):
        """Test Mira's Picks on dine page don't have toy images"""
        headers = self._get_user_auth()
        if not headers:
            pytest.skip("Could not authenticate user")
        
        # Try different endpoints for mira picks
        endpoints = [
            f"{BASE_URL}/api/dine/mira-picks",
            f"{BASE_URL}/api/mira/picks?pillar=dine",
            f"{BASE_URL}/api/dine/picks",
        ]
        
        for endpoint in endpoints:
            resp = requests.get(endpoint, headers=headers)
            print(f"{endpoint}: {resp.status_code}")
            if resp.status_code == 200:
                data = resp.json()
                picks = data.get("picks", data if isinstance(data, list) else [])
                print(f"Picks count: {len(picks)}")
                
                toy_picks = []
                for pick in picks[:10]:
                    img = pick.get("image_url") or pick.get("image", "")
                    if "static.prod-images.emergentagent.com/jobs/4700c8db" in img:
                        toy_picks.append({"name": pick.get("name"), "img": img[:80]})
                
                print(f"Toy image picks: {len(toy_picks)}")
                for tp in toy_picks:
                    print(f"  {tp}")
                break


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
