"""
Test meal_box_routes.py
Tests for:
- GET /api/mira/meal-box-products (5 slots, teaser_desc)
- POST /api/concierge/meal-box (submission → ticket ID)
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestMealBoxProducts:
    """GET /api/mira/meal-box-products endpoint tests"""

    def test_meal_box_products_returns_200(self):
        """Basic call returns 200"""
        r = requests.get(f"{BASE_URL}/api/mira/meal-box-products", params={
            "pet_id": "pet-mojo-7327ad56",
            "allergies": "chicken",
            "fav_protein": "salmon",
            "health_condition": "lymphoma - on treatment",
            "pet_name": "Mojo",
        })
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"

    def test_meal_box_products_returns_5_slots(self):
        """Should return exactly 5 slot keys: morning, evening, treat, supplement, health"""
        r = requests.get(f"{BASE_URL}/api/mira/meal-box-products", params={
            "pet_id": "pet-mojo-7327ad56",
            "allergies": "chicken",
            "fav_protein": "salmon",
            "health_condition": "lymphoma - on treatment",
            "pet_name": "Mojo",
        })
        assert r.status_code == 200
        data = r.json()
        assert "slots" in data, "Response missing 'slots' key"
        slots = data["slots"]
        assert len(slots) == 5, f"Expected 5 slots, got {len(slots)}: {[s.get('key') for s in slots]}"

    def test_meal_box_products_slot_keys(self):
        """Verify slot keys are exactly morning, evening, treat, supplement, health"""
        r = requests.get(f"{BASE_URL}/api/mira/meal-box-products", params={
            "pet_id": "pet-mojo-7327ad56",
            "allergies": "chicken",
            "fav_protein": "salmon",
            "health_condition": "lymphoma - on treatment",
            "pet_name": "Mojo",
        })
        data = r.json()
        keys = {s["key"] for s in data["slots"]}
        expected_keys = {"morning", "evening", "treat", "supplement", "health"}
        assert keys == expected_keys, f"Slot keys mismatch. Got: {keys}, Expected: {expected_keys}"

    def test_meal_box_products_each_slot_has_pick(self):
        """Each slot should have a pick with a name"""
        r = requests.get(f"{BASE_URL}/api/mira/meal-box-products", params={
            "pet_id": "pet-mojo-7327ad56",
            "allergies": "chicken",
            "fav_protein": "salmon",
            "health_condition": "lymphoma - on treatment",
            "pet_name": "Mojo",
        })
        data = r.json()
        for slot in data["slots"]:
            pick = slot.get("pick", {})
            assert pick.get("name"), f"Slot '{slot['key']}' has no pick.name"
            assert "key" in slot, f"Slot missing 'key'"
            assert "label" in slot, f"Slot missing 'label'"
            assert "emoji" in slot, f"Slot missing 'emoji'"
            assert "alternatives" in slot, f"Slot missing 'alternatives'"

    def test_meal_box_teaser_desc_salmon_forward(self):
        """teaser_desc should contain 'Salmon-forward' for Mojo (fav_protein=salmon)"""
        r = requests.get(f"{BASE_URL}/api/mira/meal-box-products", params={
            "pet_id": "pet-mojo-7327ad56",
            "allergies": "chicken",
            "fav_protein": "salmon",
            "health_condition": "lymphoma - on treatment",
            "pet_name": "Mojo",
        })
        data = r.json()
        teaser = data.get("teaser_desc", "")
        assert teaser, "teaser_desc is empty"
        assert "salmon" in teaser.lower() or "Salmon" in teaser, (
            f"teaser_desc should contain 'Salmon-forward' for Mojo, got: '{teaser}'"
        )

    def test_meal_box_teaser_desc_chicken_free(self):
        """teaser_desc should mention chicken-free (allergy=chicken)"""
        r = requests.get(f"{BASE_URL}/api/mira/meal-box-products", params={
            "pet_id": "pet-mojo-7327ad56",
            "allergies": "chicken",
            "fav_protein": "salmon",
            "health_condition": "lymphoma - on treatment",
            "pet_name": "Mojo",
        })
        data = r.json()
        teaser = data.get("teaser_desc", "")
        assert "chicken-free" in teaser.lower(), (
            f"teaser_desc should mention 'chicken-free', got: '{teaser}'"
        )

    def test_meal_box_teaser_desc_health_condition(self):
        """teaser_desc should mention health condition (lymphoma)"""
        r = requests.get(f"{BASE_URL}/api/mira/meal-box-products", params={
            "pet_id": "pet-mojo-7327ad56",
            "allergies": "chicken",
            "fav_protein": "salmon",
            "health_condition": "lymphoma - on treatment",
            "pet_name": "Mojo",
        })
        data = r.json()
        teaser = data.get("teaser_desc", "")
        assert "lymphoma" in teaser.lower(), (
            f"teaser_desc should mention 'lymphoma', got: '{teaser}'"
        )

    def test_meal_box_products_no_chicken_in_picks(self):
        """When allergy=chicken, none of the picked product names should contain 'chicken'"""
        r = requests.get(f"{BASE_URL}/api/mira/meal-box-products", params={
            "pet_id": "pet-mojo-7327ad56",
            "allergies": "chicken",
            "fav_protein": "salmon",
            "health_condition": "lymphoma - on treatment",
            "pet_name": "Mojo",
        })
        data = r.json()
        for slot in data["slots"]:
            pick = slot.get("pick", {})
            name_lower = pick.get("name", "").lower()
            # Mira Imagines items are OK — no DB products with chicken
            if not pick.get("is_mira_imagines"):
                assert "chicken" not in name_lower, (
                    f"Slot '{slot['key']}' pick contains chicken allergen: {pick.get('name')}"
                )

    def test_meal_box_products_missing_pet_id(self):
        """pet_id is required — missing should return 422"""
        r = requests.get(f"{BASE_URL}/api/mira/meal-box-products", params={
            "allergies": "chicken",
            "fav_protein": "salmon",
        })
        assert r.status_code == 422, f"Expected 422 for missing pet_id, got {r.status_code}"

    def test_meal_box_products_has_pet_name(self):
        """Response should echo pet_name back"""
        r = requests.get(f"{BASE_URL}/api/mira/meal-box-products", params={
            "pet_id": "pet-mojo-7327ad56",
            "allergies": "chicken",
            "fav_protein": "salmon",
            "health_condition": "lymphoma - on treatment",
            "pet_name": "Mojo",
        })
        data = r.json()
        assert data.get("pet_name") == "Mojo", f"pet_name mismatch: {data.get('pet_name')}"


class TestMealBoxSubmission:
    """POST /api/concierge/meal-box endpoint tests"""

    SAMPLE_SLOTS = [
        {"key": "morning", "label": "Morning Meal", "pick": {"name": "Salmon & Sweet Potato Morning Bowl", "id": "test-prod-1"}},
        {"key": "evening", "label": "Evening Meal", "pick": {"name": "Salmon & Lentil Evening Dinner", "id": "test-prod-2"}},
        {"key": "treat",   "label": "Daily Treat",  "pick": {"name": "Salmon Training Bites", "id": "test-prod-3"}},
        {"key": "supplement", "label": "Daily Supplement", "pick": {"name": "Canine Immunity Booster", "id": "test-prod-4"}},
        {"key": "health",  "label": "Health Support", "pick": {"name": "Turmeric & Black Pepper Blend", "id": "test-prod-5"}},
    ]

    def test_submit_meal_box_returns_200(self):
        """Submission should return 200 with success=True"""
        r = requests.post(f"{BASE_URL}/api/concierge/meal-box", json={
            "pet_id": "pet-mojo-7327ad56",
            "pet_name": "Mojo",
            "meals_per_day": 2,
            "delivery_frequency": "weekly",
            "allergies_confirmed": True,
            "slots": self.SAMPLE_SLOTS,
            "user_email": "test@example.com",
            "user_name": "Test User",
        })
        assert r.status_code == 200, f"Expected 200, got {r.status_code}: {r.text}"

    def test_submit_meal_box_returns_ticket_id(self):
        """Response should have success=True and a ticket_id"""
        r = requests.post(f"{BASE_URL}/api/concierge/meal-box", json={
            "pet_id": "pet-mojo-7327ad56",
            "pet_name": "Mojo",
            "meals_per_day": 2,
            "delivery_frequency": "weekly",
            "allergies_confirmed": True,
            "slots": self.SAMPLE_SLOTS,
            "user_email": "test@example.com",
            "user_name": "Test User",
        })
        data = r.json()
        assert data.get("success") is True, f"success not True: {data}"
        ticket_id = data.get("ticket_id", "")
        assert ticket_id, f"ticket_id is empty: {data}"
        # Format: MEAL-YYYYMMDD-XXXXXX
        assert ticket_id.startswith("MEAL-"), f"ticket_id should start with 'MEAL-', got: {ticket_id}"

    def test_submit_meal_box_ticket_id_format(self):
        """ticket_id should match MEAL-YYYYMMDD-XXXXXX format"""
        import re
        r = requests.post(f"{BASE_URL}/api/concierge/meal-box", json={
            "pet_id": "pet-mojo-7327ad56",
            "pet_name": "Mojo",
            "meals_per_day": 1,
            "delivery_frequency": "fortnightly",
            "allergies_confirmed": True,
            "slots": self.SAMPLE_SLOTS[:4],
            "user_email": "dipali@clubconcierge.in",
            "user_name": "Dipali",
        })
        data = r.json()
        ticket_id = data.get("ticket_id", "")
        pattern = r"^MEAL-\d{8}-[A-F0-9]{6}$"
        assert re.match(pattern, ticket_id), (
            f"ticket_id '{ticket_id}' does not match pattern MEAL-YYYYMMDD-XXXXXX"
        )

    def test_submit_meal_box_missing_required_fields(self):
        """Missing required fields should return 422"""
        r = requests.post(f"{BASE_URL}/api/concierge/meal-box", json={
            "pet_name": "Mojo",
            # pet_id missing
            "meals_per_day": 2,
            "delivery_frequency": "weekly",
            "allergies_confirmed": True,
            "slots": self.SAMPLE_SLOTS,
        })
        assert r.status_code == 422, f"Expected 422, got {r.status_code}: {r.text}"

    def test_submit_meal_box_message_in_response(self):
        """Response should include a message"""
        r = requests.post(f"{BASE_URL}/api/concierge/meal-box", json={
            "pet_id": "pet-mojo-7327ad56",
            "pet_name": "Mojo",
            "meals_per_day": 2,
            "delivery_frequency": "monthly",
            "allergies_confirmed": True,
            "slots": self.SAMPLE_SLOTS,
            "user_email": "test@example.com",
            "user_name": "Test",
        })
        data = r.json()
        assert data.get("message"), f"response missing 'message': {data}"
        assert "Mojo" in data["message"], f"message should mention pet name: {data['message']}"
