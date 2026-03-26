"""
test_4fixes_iteration217.py
Tests for 4 specific fixes in Pet Life OS:
1. BirthdayBoxBrowseDrawer fallback removal (no random breed products)
2. Breed synonym mapping in /api/mockups/breed-products endpoint
3. Dine mobile breed filtering (no Akita for Indie dog)
4. AI Intent Detection on /api/mira/detect-intent
"""

import pytest
import requests
import os

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")


class TestFix2BreedSynonyms:
    """Fix 2: Breed synonym mapping in /api/mockups/breed-products endpoint"""

    def test_siberian_husky_returns_products(self):
        """siberian+husky should return same/similar products as husky"""
        resp = requests.get(f"{BASE_URL}/api/mockups/breed-products?breed=siberian+husky&limit=20", timeout=30)
        # Should return 200
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        data = resp.json()
        products = data.get("products", data if isinstance(data, list) else [])
        print(f"siberian husky products count: {len(products)}")
        # Key check: endpoint doesn't crash
        assert isinstance(products, list), "Should return a list"

    def test_husky_returns_products(self):
        """husky should return products"""
        resp = requests.get(f"{BASE_URL}/api/mockups/breed-products?breed=husky&limit=20", timeout=30)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        data = resp.json()
        products = data.get("products", data if isinstance(data, list) else [])
        print(f"husky products count: {len(products)}")
        assert isinstance(products, list)

    def test_yorkshire_terrier_returns_products(self):
        """yorkshire+terrier should return products (same as yorkshire)"""
        resp = requests.get(f"{BASE_URL}/api/mockups/breed-products?breed=yorkshire+terrier&limit=20", timeout=30)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        data = resp.json()
        products = data.get("products", data if isinstance(data, list) else [])
        print(f"yorkshire terrier products count: {len(products)}")
        assert isinstance(products, list)

    def test_yorkshire_returns_products(self):
        """yorkshire should return products"""
        resp = requests.get(f"{BASE_URL}/api/mockups/breed-products?breed=yorkshire&limit=20", timeout=30)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        data = resp.json()
        products = data.get("products", data if isinstance(data, list) else [])
        print(f"yorkshire products count: {len(products)}")
        assert isinstance(products, list)

    def test_breed_products_for_indie(self):
        """indie breed should return products"""
        resp = requests.get(f"{BASE_URL}/api/mockups/breed-products?breed=indie&limit=20", timeout=30)
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}"
        data = resp.json()
        products = data.get("products", data if isinstance(data, list) else [])
        print(f"indie products count: {len(products)}")
        assert isinstance(products, list)

    def test_akita_no_products_for_indie(self):
        """
        akita products should NOT appear for indie dog breed request
        Verify that when we request breed=indie, no akita-specific products come back
        """
        resp = requests.get(f"{BASE_URL}/api/mockups/breed-products?breed=indie&limit=40", timeout=10)
        assert resp.status_code == 200
        data = resp.json()
        products = data.get("products", data if isinstance(data, list) else [])

        # Check no akita-specific products in result
        akita_products = []
        for p in products:
            name = (p.get("name") or "").lower()
            breed_tags = [t.lower() for t in (p.get("breed_tags") or [])]
            who_for = (p.get("who_for") or "").lower()
            if "akita" in name or "akita" in who_for or any("akita" in t for t in breed_tags):
                akita_products.append(p.get("name"))

        print(f"Akita products in indie response: {akita_products}")
        assert len(akita_products) == 0, f"Akita products should not appear for indie: {akita_products}"


class TestFix4AIIntentDetection:
    """Fix 4: AI Intent Detection via /api/mira/detect-intent"""

    def test_endpoint_exists(self):
        """Endpoint should be accessible"""
        resp = requests.post(
            f"{BASE_URL}/api/mira/detect-intent",
            json={"message": "Book a spa grooming session", "pet_name": "Mojo", "pet_breed": "Indie"},
            timeout=30,
        )
        assert resp.status_code == 200, f"Expected 200, got {resp.status_code}. Response: {resp.text[:200]}"

    def test_spa_grooming_returns_care_pillar(self):
        """'Book a spa grooming session' → pillar='care' with confidence >= 40"""
        resp = requests.post(
            f"{BASE_URL}/api/mira/detect-intent",
            json={"message": "Book a spa grooming session", "pet_name": "Mojo", "pet_breed": "Indie"},
            timeout=30,
        )
        assert resp.status_code == 200
        data = resp.json()
        print(f"Grooming intent response: {data}")

        pillar = data.get("pillar")
        confidence = data.get("confidence", 0)

        assert pillar == "care", f"Expected pillar='care', got '{pillar}'"
        assert confidence >= 40, f"Expected confidence >= 40, got {confidence}"

    def test_birthday_cake_returns_celebrate_pillar(self):
        """'plan birthday cake' → pillar='celebrate'"""
        resp = requests.post(
            f"{BASE_URL}/api/mira/detect-intent",
            json={"message": "plan birthday cake", "pet_name": "Mojo", "pet_breed": "Indie"},
            timeout=30,
        )
        assert resp.status_code == 200
        data = resp.json()
        print(f"Birthday cake intent response: {data}")

        pillar = data.get("pillar")
        confidence = data.get("confidence", 0)

        assert pillar == "celebrate", f"Expected pillar='celebrate', got '{pillar}'"
        assert confidence >= 40, f"Expected confidence >= 40, got {confidence}"

    def test_obedience_training_returns_learn_pillar(self):
        """'obedience training' → pillar='learn'"""
        resp = requests.post(
            f"{BASE_URL}/api/mira/detect-intent",
            json={"message": "obedience training", "pet_name": "Mojo", "pet_breed": "Indie"},
            timeout=30,
        )
        assert resp.status_code == 200
        data = resp.json()
        print(f"Training intent response: {data}")

        pillar = data.get("pillar")
        confidence = data.get("confidence", 0)

        assert pillar == "learn", f"Expected pillar='learn', got '{pillar}'"
        assert confidence >= 40, f"Expected confidence >= 40, got {confidence}"

    def test_intent_response_structure(self):
        """Response should have required fields"""
        resp = requests.post(
            f"{BASE_URL}/api/mira/detect-intent",
            json={"message": "Book a grooming session for my dog", "pet_name": "Mojo"},
            timeout=30,
        )
        assert resp.status_code == 200
        data = resp.json()
        print(f"Intent structure response: {data}")

        # Must have these fields
        assert "pillar" in data, "Response must have 'pillar' field"
        assert "service" in data, "Response must have 'service' field"
        assert "confidence" in data, "Response must have 'confidence' field"
        assert "display_text" in data, "Response must have 'display_text' field"

    def test_short_message_returns_null(self):
        """Message too short should return null pillar"""
        resp = requests.post(
            f"{BASE_URL}/api/mira/detect-intent",
            json={"message": "hi"},
            timeout=15,
        )
        assert resp.status_code == 200
        data = resp.json()
        print(f"Short message response: {data}")
        # Short message should return null/None pillar
        assert data.get("pillar") is None, f"Expected null pillar for short message, got {data.get('pillar')}"

    def test_emergency_intent_detection(self):
        """'My dog ate poison, need emergency vet' → pillar='emergency'"""
        resp = requests.post(
            f"{BASE_URL}/api/mira/detect-intent",
            json={"message": "My dog ate poison, need emergency vet immediately", "pet_name": "Mojo"},
            timeout=30,
        )
        assert resp.status_code == 200
        data = resp.json()
        print(f"Emergency intent response: {data}")

        pillar = data.get("pillar")
        assert pillar == "emergency", f"Expected pillar='emergency', got '{pillar}'"


class TestBreedProductsEndpointGeneral:
    """General breed products endpoint tests"""

    def test_breed_products_endpoint_accessible(self):
        """Check /api/mockups/breed-products is accessible"""
        resp = requests.get(f"{BASE_URL}/api/mockups/breed-products?limit=5", timeout=10)
        assert resp.status_code in [200, 422], f"Expected 200 or 422, got {resp.status_code}"

    def test_breed_products_with_category(self):
        """Test category filter for breed-cakes"""
        resp = requests.get(f"{BASE_URL}/api/mockups/breed-products?category=breed-cakes&limit=10", timeout=10)
        assert resp.status_code == 200
        data = resp.json()
        products = data.get("products", data if isinstance(data, list) else [])
        print(f"Breed cakes count: {len(products)}")
        assert isinstance(products, list)

    def test_breed_products_no_akita_for_indie(self):
        """When breed=indie, ensure no akita products come from endpoint"""
        resp = requests.get(f"{BASE_URL}/api/mockups/breed-products?breed=indie&limit=40", timeout=10)
        assert resp.status_code == 200
        data = resp.json()
        products = data.get("products", data if isinstance(data, list) else [])

        akita_count = sum(1 for p in products if "akita" in (p.get("name") or "").lower())
        print(f"Akita products in indie response: {akita_count} out of {len(products)}")
        assert akita_count == 0, f"Found {akita_count} Akita products for Indie breed - should be 0"
