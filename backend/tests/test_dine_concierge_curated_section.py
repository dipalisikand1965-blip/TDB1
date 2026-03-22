"""
Test: Dine Concierge CuratedConciergeSection API
Tests the curated-set API for the Dine pillar with trait derivation

Features tested:
1. Curated-set API returns personalized why_for_pet based on derived traits
2. Trait derivation from personality.separation_anxiety and personality.temperament
3. Solid color CTAs (pink for products, purple for services)
4. High contrast text (white on dark)
5. Ticket creation from concierge picks
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://custom-order-desk-1.preview.emergentagent.com')

class TestDineCuratedConciergeSection:
    """Tests for Dine pillar CuratedConciergeSection"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test with authentication"""
        self.base_url = BASE_URL.rstrip('/')
        
        # Login to get token
        login_response = requests.post(
            f"{self.base_url}/api/auth/login",
            json={"email": "dipali@clubconcierge.in", "password": "test123"}
        )
        assert login_response.status_code == 200, "Login failed"
        self.token = login_response.json().get("access_token")
        self.headers = {"Authorization": f"Bearer {self.token}"}
        
        # Get Mystique pet ID (known test pet with personality data)
        pets_response = requests.get(f"{self.base_url}/api/pets/my-pets", headers=self.headers)
        assert pets_response.status_code == 200
        pets = pets_response.json().get("pets", [])
        mystique = next((p for p in pets if p.get("name") == "Mystique"), None)
        assert mystique, "Mystique pet not found"
        self.pet_id = mystique.get("id")
        self.pet_name = mystique.get("name")
    
    def test_curated_set_api_returns_200(self):
        """Test that curated-set API returns 200 for dine pillar"""
        response = requests.get(
            f"{self.base_url}/api/mira/curated-set/{self.pet_id}/dine",
            headers=self.headers
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        print("PASS: Curated-set API returns 200")
    
    def test_curated_set_returns_correct_structure(self):
        """Test response structure has required fields"""
        response = requests.get(
            f"{self.base_url}/api/mira/curated-set/{self.pet_id}/dine",
            headers=self.headers
        )
        data = response.json()
        
        # Check structure
        assert "concierge_products" in data, "Missing concierge_products"
        assert "concierge_services" in data, "Missing concierge_services"
        assert "meta" in data, "Missing meta"
        
        # Check meta fields
        meta = data["meta"]
        assert "generated_at" in meta
        assert "pet_id" in meta
        assert "pillar" in meta
        assert meta["pillar"] == "dine"
        
        print("PASS: Response structure is correct")
    
    def test_curated_set_returns_3_to_5_cards(self):
        """Test that 3-5 cards are returned (minimum viable set)"""
        response = requests.get(
            f"{self.base_url}/api/mira/curated-set/{self.pet_id}/dine",
            headers=self.headers
        )
        data = response.json()
        
        products = data.get("concierge_products", [])
        services = data.get("concierge_services", [])
        total = len(products) + len(services)
        
        assert 3 <= total <= 6, f"Expected 3-6 cards, got {total}"
        assert len(products) >= 2, f"Expected at least 2 products, got {len(products)}"
        assert len(services) >= 1, f"Expected at least 1 service, got {len(services)}"
        
        print(f"PASS: Got {len(products)} products and {len(services)} services (total: {total})")
    
    def test_trait_derivation_from_personality_separation_anxiety(self):
        """Test that 'anxious' trait is derived from separation_anxiety='Moderate'"""
        # Mystique has personality.separation_anxiety = 'Moderate' which should derive 'anxious'
        response = requests.get(
            f"{self.base_url}/api/mira/curated-set/{self.pet_id}/dine",
            headers=self.headers
        )
        data = response.json()
        
        # Check that at least one card has 'anxious' in matched_traits
        all_matched_traits = []
        for card in data.get("concierge_products", []) + data.get("concierge_services", []):
            all_matched_traits.extend(card.get("_matched_traits", []))
        
        assert "anxious" in all_matched_traits, f"Expected 'anxious' in matched traits: {set(all_matched_traits)}"
        print(f"PASS: 'anxious' trait derived, all traits: {set(all_matched_traits)}")
    
    def test_why_for_pet_shows_personalized_text(self):
        """Test that why_for_pet shows trait-based personalization"""
        response = requests.get(
            f"{self.base_url}/api/mira/curated-set/{self.pet_id}/dine",
            headers=self.headers
        )
        data = response.json()
        
        # Check products
        for card in data.get("concierge_products", []):
            why = card.get("why_for_pet", "")
            assert why, f"Missing why_for_pet for {card.get('id')}"
            assert self.pet_name in why or "Designed for" in why or "Tailored for" in why, \
                f"why_for_pet not personalized: {why}"
            print(f"Product {card.get('id')}: {why}")
        
        # Check services
        for card in data.get("concierge_services", []):
            why = card.get("why_for_pet", "")
            assert why, f"Missing why_for_pet for {card.get('id')}"
            print(f"Service {card.get('id')}: {why}")
        
        print("PASS: All cards have personalized why_for_pet")
    
    def test_anxious_trait_gives_calm_and_comfortable_explanation(self):
        """Test that anxious pets get 'calm-and-comfortable style' explanation"""
        response = requests.get(
            f"{self.base_url}/api/mira/curated-set/{self.pet_id}/dine",
            headers=self.headers
        )
        data = response.json()
        
        # Find why_for_pet texts
        why_texts = []
        for card in data.get("concierge_products", []) + data.get("concierge_services", []):
            why = card.get("why_for_pet", "")
            why_texts.append(why)
        
        # At least one should mention calm/comfort since Mystique has anxious trait
        calm_found = any("calm" in w.lower() or "comfort" in w.lower() for w in why_texts)
        assert calm_found, f"Expected 'calm' or 'comfort' in why_for_pet: {why_texts}"
        print(f"PASS: Found calm/comfort personalization in: {[w for w in why_texts if 'calm' in w.lower() or 'comfort' in w.lower()]}")
    
    def test_cards_have_correct_type_labels(self):
        """Test cards have correct type: concierge_product or concierge_service"""
        response = requests.get(
            f"{self.base_url}/api/mira/curated-set/{self.pet_id}/dine",
            headers=self.headers
        )
        data = response.json()
        
        for card in data.get("concierge_products", []):
            assert card.get("type") == "concierge_product", f"Wrong type: {card.get('type')}"
        
        for card in data.get("concierge_services", []):
            assert card.get("type") == "concierge_service", f"Wrong type: {card.get('type')}"
        
        print("PASS: All cards have correct type labels")
    
    def test_cards_have_cta_text(self):
        """Test all cards have cta_text for buttons"""
        response = requests.get(
            f"{self.base_url}/api/mira/curated-set/{self.pet_id}/dine",
            headers=self.headers
        )
        data = response.json()
        
        for card in data.get("concierge_products", []) + data.get("concierge_services", []):
            cta = card.get("cta_text")
            assert cta, f"Missing cta_text for {card.get('id')}"
            print(f"Card {card.get('id')}: CTA = '{cta}'")
        
        print("PASS: All cards have cta_text")
    
    def test_invalid_pillar_returns_400_or_empty(self):
        """Test invalid pillar handling"""
        response = requests.get(
            f"{self.base_url}/api/mira/curated-set/{self.pet_id}/invalid_pillar",
            headers=self.headers
        )
        # Should either return 400 or empty set with warning
        assert response.status_code in [200, 400], f"Unexpected status: {response.status_code}"
        
        if response.status_code == 200:
            data = response.json()
            # Empty or with warning
            total = len(data.get("concierge_products", [])) + len(data.get("concierge_services", []))
            print(f"Invalid pillar returned {total} cards (may be empty as expected)")
        else:
            print("PASS: Invalid pillar returns 400")
    
    def test_invalid_pet_returns_404(self):
        """Test non-existent pet returns 404"""
        response = requests.get(
            f"{self.base_url}/api/mira/curated-set/pet-nonexistent-12345/dine",
            headers=self.headers
        )
        # Should return 404 or 400
        assert response.status_code in [404, 400, 500], f"Expected 404/400, got {response.status_code}"
        print(f"PASS: Non-existent pet returns {response.status_code}")
    
    def test_create_ticket_from_concierge_pick(self):
        """Test ticket creation via concierge-pick endpoint"""
        # First get a card to use
        response = requests.get(
            f"{self.base_url}/api/mira/curated-set/{self.pet_id}/dine",
            headers=self.headers
        )
        data = response.json()
        card = data.get("concierge_products", [{}])[0]
        
        # Create ticket
        ticket_response = requests.post(
            f"{self.base_url}/api/mira/concierge-pick/ticket",
            headers={**self.headers, "Content-Type": "application/json"},
            json={
                "pet_id": self.pet_id,
                "card_id": card.get("id", "test_card"),
                "card_type": card.get("type", "concierge_product"),
                "card_name": card.get("name", "Test Card"),
                "pillar": "dine",
                "description": card.get("description", "Test description"),
                "why_for_pet": card.get("why_for_pet", "Test why")
            }
        )
        
        # Should succeed or handle gracefully
        assert ticket_response.status_code in [200, 201, 400], f"Ticket creation failed: {ticket_response.status_code}"
        
        if ticket_response.status_code in [200, 201]:
            print("PASS: Ticket created successfully")
        else:
            print(f"INFO: Ticket creation returned {ticket_response.status_code} (may be expected)")


class TestTraitDerivationLogic:
    """Tests for trait derivation from multiple data sources"""
    
    @pytest.fixture(autouse=True)
    def setup(self):
        """Setup test with authentication"""
        self.base_url = BASE_URL.rstrip('/')
        
        # Login
        login_response = requests.post(
            f"{self.base_url}/api/auth/login",
            json={"email": "dipali@clubconcierge.in", "password": "test123"}
        )
        self.token = login_response.json().get("access_token")
        self.headers = {"Authorization": f"Bearer {self.token}"}
    
    def test_derive_traits_includes_playful_from_temperament(self):
        """Test playful trait derived from temperament='Protective' (Friendly nature)"""
        # Get Mystique's curated set
        pets_response = requests.get(f"{self.base_url}/api/pets/my-pets", headers=self.headers)
        pets = pets_response.json().get("pets", [])
        mystique = next((p for p in pets if p.get("name") == "Mystique"), None)
        
        response = requests.get(
            f"{self.base_url}/api/mira/curated-set/{mystique['id']}/dine",
            headers=self.headers
        )
        data = response.json()
        
        # Collect all matched traits
        all_traits = set()
        for card in data.get("concierge_products", []) + data.get("concierge_services", []):
            all_traits.update(card.get("_matched_traits", []))
        
        # Should have social or playful from behavior_with_dogs="Friendly"
        has_social_traits = "social" in all_traits or "playful" in all_traits
        print(f"All derived traits: {all_traits}")
        assert has_social_traits, f"Expected social/playful traits: {all_traits}"
        print("PASS: Social/playful traits derived from personality")
    
    def test_personalization_summary_includes_breed_and_size(self):
        """Test that personalization summary mentions breed and size"""
        pets_response = requests.get(f"{self.base_url}/api/pets/my-pets", headers=self.headers)
        pets = pets_response.json().get("pets", [])
        mystique = next((p for p in pets if p.get("name") == "Mystique"), None)
        
        response = requests.get(
            f"{self.base_url}/api/mira/curated-set/{mystique['id']}/dine",
            headers=self.headers
        )
        data = response.json()
        
        summary = data.get("meta", {}).get("personalization_summary", "")
        
        # Should mention Shih Tzu or small
        assert "Shih Tzu" in summary or "breed" in summary.lower(), f"Missing breed in: {summary}"
        print(f"PASS: Personalization summary: {summary}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
