"""
Test Birthday Box Routes
Tests /api/birthday-box/{pet_id}/preview, /api/birthday-box/{pet_id} (full),
and /api/birthday-box/{pet_id}/build endpoints.
Pet: Mojo (pet-mojo-7327ad56) with chicken + soy allergies
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
MOJO_PET_ID = "pet-mojo-7327ad56"


class TestBirthdayBoxPreview:
    """Test /api/birthday-box/{pet_id}/preview endpoint"""

    def test_preview_returns_200_for_mojo(self):
        """GET /api/birthday-box/pet-mojo-7327ad56/preview should return 200"""
        response = requests.get(f"{BASE_URL}/api/birthday-box/{MOJO_PET_ID}/preview")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text[:200]}"
        print("✓ Preview endpoint returns 200 for Mojo")

    def test_preview_has_required_fields(self):
        """Preview response should contain all required fields"""
        response = requests.get(f"{BASE_URL}/api/birthday-box/{MOJO_PET_ID}/preview")
        assert response.status_code == 200
        data = response.json()

        required_fields = ["petId", "petName", "visibleSlots", "hiddenSlots",
                           "soulPercent", "hasAllergies", "allergies"]
        for field in required_fields:
            assert field in data, f"Missing field: {field}"
        print(f"✓ Preview has all required fields. petName={data['petName']}, soulPercent={data['soulPercent']}")

    def test_preview_has_4_visible_and_2_hidden_slots(self):
        """Preview should have 4 visible slots + 2 hidden slots"""
        response = requests.get(f"{BASE_URL}/api/birthday-box/{MOJO_PET_ID}/preview")
        assert response.status_code == 200
        data = response.json()

        visible = data.get("visibleSlots", [])
        hidden = data.get("hiddenSlots", [])
        assert len(visible) == 4, f"Expected 4 visible slots, got {len(visible)}"
        assert len(hidden) == 2, f"Expected 2 hidden slots, got {len(hidden)}"
        print(f"✓ 4 visible + 2 hidden slots confirmed")

    def test_preview_slot1_is_allergy_safe_cake(self):
        """Slot 1 (Hero Item) should be an allergy-safe cake (NOT chicken, since Mojo has chicken allergy)"""
        response = requests.get(f"{BASE_URL}/api/birthday-box/{MOJO_PET_ID}/preview")
        assert response.status_code == 200
        data = response.json()

        slot1 = data["visibleSlots"][0]
        assert slot1["slotNumber"] == 1, f"Expected slot 1, got {slot1['slotNumber']}"

        # Mojo has chicken allergy — slot1 chipLabel should NOT contain chicken
        chip_label = slot1.get("chipLabel", "").lower()
        assert "chicken" not in chip_label, \
            f"Slot 1 chipLabel '{chip_label}' contains 'chicken' — allergy not filtered!"

        # Should be allergy-safe
        assert "allergy-safe" in chip_label or slot1.get("isAllergySafe"), \
            f"Slot 1 should be allergy-safe. chipLabel='{chip_label}'"

        print(f"✓ Slot 1 is allergy-safe: '{slot1.get('chipLabel')}'")

    def test_preview_mojo_has_allergies(self):
        """Mojo has chicken allergy — hasAllergies should be True"""
        response = requests.get(f"{BASE_URL}/api/birthday-box/{MOJO_PET_ID}/preview")
        assert response.status_code == 200
        data = response.json()

        assert data["hasAllergies"] == True, f"Expected hasAllergies=True for Mojo"
        allergies = data.get("allergies", [])
        assert len(allergies) > 0, "Allergies list should not be empty"
        assert "chicken" in allergies, f"Mojo should have chicken in allergies: {allergies}"
        print(f"✓ Mojo allergies detected: {allergies}")

    def test_preview_slot_structure(self):
        """All slots should have required keys: slotNumber, emoji, chipLabel"""
        response = requests.get(f"{BASE_URL}/api/birthday-box/{MOJO_PET_ID}/preview")
        assert response.status_code == 200
        data = response.json()

        all_slots = data["visibleSlots"] + data["hiddenSlots"]
        for slot in all_slots:
            assert "slotNumber" in slot, f"Slot missing slotNumber: {slot}"
            assert "emoji" in slot, f"Slot {slot.get('slotNumber')} missing emoji"
            assert "chipLabel" in slot, f"Slot {slot.get('slotNumber')} missing chipLabel"
        print(f"✓ All {len(all_slots)} slots have required structure")

    def test_preview_slot1_salmon_birthday_cake(self):
        """For Mojo (Shih Tzu or chicken allergy), Slot 1 should be Salmon birthday cake"""
        response = requests.get(f"{BASE_URL}/api/birthday-box/{MOJO_PET_ID}/preview")
        assert response.status_code == 200
        data = response.json()

        slot1 = data["visibleSlots"][0]
        chip_label = slot1.get("chipLabel", "").lower()
        # Mojo has chicken allergy, so should use safe alternative like salmon
        # The spec says: Slot1=Salmon cake(allergy-safe)
        assert "salmon" in chip_label or "allergy-safe" in chip_label, \
            f"Slot 1 should be salmon cake or allergy-safe, got: '{chip_label}'"
        print(f"✓ Slot 1 chipLabel: '{slot1.get('chipLabel')}'")

    def test_preview_returns_404_for_unknown_pet(self):
        """GET /api/birthday-box/unknown-pet/preview should return 404"""
        response = requests.get(f"{BASE_URL}/api/birthday-box/unknown-pet-xyz-abc/preview")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Unknown pet returns 404")


class TestBirthdayBoxBuild:
    """Test /api/birthday-box/{pet_id}/build endpoint"""

    def _get_preview_slots(self):
        """Helper: fetch Mojo's box preview and return all slots"""
        response = requests.get(f"{BASE_URL}/api/birthday-box/{MOJO_PET_ID}/preview")
        assert response.status_code == 200
        data = response.json()
        return data["visibleSlots"] + data["hiddenSlots"]

    def test_build_requires_allergy_confirmation(self):
        """POST /build without allergyConfirmed=True should return allergy_confirmation_required"""
        slots = self._get_preview_slots()
        response = requests.post(
            f"{BASE_URL}/api/birthday-box/{MOJO_PET_ID}/build",
            json={"slots": slots, "allergyConfirmed": False}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data["success"] == False, "Expected success=False without allergy confirmation"
        assert data["error"] == "allergy_confirmation_required", \
            f"Expected allergy_confirmation_required error, got: {data.get('error')}"
        print(f"✓ Build correctly requires allergy confirmation for Mojo. Message: {data.get('message')}")

    def test_build_succeeds_with_allergy_confirmed(self):
        """POST /build with allergyConfirmed=True should succeed"""
        slots = self._get_preview_slots()
        response = requests.post(
            f"{BASE_URL}/api/birthday-box/{MOJO_PET_ID}/build",
            json={"slots": slots, "allergyConfirmed": True}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text[:200]}"
        data = response.json()
        assert data["success"] == True, f"Expected success=True, got: {data}"
        assert "orderId" in data, "Response should contain orderId"
        assert data["orderId"].startswith("bbox-"), \
            f"orderId should start with 'bbox-', got: {data['orderId']}"
        print(f"✓ Build succeeded. orderId: {data['orderId']}, message: {data.get('message')}")

    def test_build_returns_order_id(self):
        """Build response should contain a valid orderId"""
        slots = self._get_preview_slots()
        response = requests.post(
            f"{BASE_URL}/api/birthday-box/{MOJO_PET_ID}/build",
            json={"slots": slots, "allergyConfirmed": True}
        )
        assert response.status_code == 200
        data = response.json()
        assert "orderId" in data
        order_id = data["orderId"]
        assert isinstance(order_id, str) and len(order_id) > 0, "orderId should be a non-empty string"
        print(f"✓ Valid orderId returned: {order_id}")

    def test_build_returns_404_for_unknown_pet(self):
        """POST /build for unknown pet should return 404"""
        response = requests.post(
            f"{BASE_URL}/api/birthday-box/unknown-pet-xyz/build",
            json={"slots": [], "allergyConfirmed": True}
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Unknown pet build returns 404")

    def test_build_without_allergy_confirmation_message_mentions_allergies(self):
        """Error message should mention Mojo's allergies"""
        slots = self._get_preview_slots()
        response = requests.post(
            f"{BASE_URL}/api/birthday-box/{MOJO_PET_ID}/build",
            json={"slots": slots, "allergyConfirmed": False}
        )
        assert response.status_code == 200
        data = response.json()
        message = data.get("message", "").lower()
        # Message should mention "chicken" or "allerg"
        assert "allerg" in message or "chicken" in message, \
            f"Error message should mention allergies: '{data.get('message')}'"
        print(f"✓ Allergy error message is informative: '{data.get('message')}'")


class TestBirthdayBoxFull:
    """Test /api/birthday-box/{pet_id} (full endpoint)"""

    def test_full_endpoint_returns_200(self):
        """GET /api/birthday-box/pet-mojo-7327ad56 should return 200"""
        response = requests.get(f"{BASE_URL}/api/birthday-box/{MOJO_PET_ID}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text[:200]}"
        print("✓ Full birthday box endpoint returns 200")

    def test_full_endpoint_has_all_slots(self):
        """Full endpoint should return allSlots with 6 items"""
        response = requests.get(f"{BASE_URL}/api/birthday-box/{MOJO_PET_ID}")
        assert response.status_code == 200
        data = response.json()
        assert "allSlots" in data, "Full response should have allSlots"
        all_slots = data["allSlots"]
        assert len(all_slots) == 6, f"Expected 6 slots, got {len(all_slots)}"
        print(f"✓ Full endpoint has 6 total slots")

    def test_full_endpoint_has_currency_and_total_price(self):
        """Full endpoint should return currency and totalPrice"""
        response = requests.get(f"{BASE_URL}/api/birthday-box/{MOJO_PET_ID}")
        assert response.status_code == 200
        data = response.json()
        assert "currency" in data, "Response should have currency"
        assert data["currency"] == "INR", f"Expected INR, got {data.get('currency')}"
        assert "totalPrice" in data, "Response should have totalPrice"
        print(f"✓ Full endpoint has currency=INR, totalPrice={data.get('totalPrice')}")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
