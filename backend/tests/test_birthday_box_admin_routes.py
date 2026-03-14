"""
test_birthday_box_admin_routes.py
Tests for Birthday Box Service Desk Admin endpoints:
- GET /api/admin/birthday-box-orders (list orders)
- GET /api/admin/birthday-box-orders/{id} (order detail)
- PATCH /api/admin/birthday-box-orders/{id}/status (status transition)
- PATCH /api/admin/birthday-box-orders/{id}/slot/{n}/assemble (slot assembly)
- POST /api/admin/birthday-box-orders/{id}/note (add note)
- POST /api/admin/birthday-box-orders/{id}/allergy-confirm (allergy confirmation)
"""

import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestListBirthdayBoxOrders:
    """Tests for GET /api/admin/birthday-box-orders"""

    def test_list_orders_returns_200(self):
        """List orders endpoint returns 200"""
        response = requests.get(f"{BASE_URL}/api/admin/birthday-box-orders")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text[:200]}"
        print("✓ List orders returns 200")

    def test_list_orders_returns_28_orders(self):
        """There should be 28 birthday box orders"""
        response = requests.get(f"{BASE_URL}/api/admin/birthday-box-orders?limit=200")
        assert response.status_code == 200
        data = response.json()
        total = data.get("counts", {}).get("total", 0)
        assert total == 28, f"Expected 28 orders, got {total}"
        print(f"✓ Total orders: {total}")

    def test_list_orders_has_counts(self):
        """Response should have counts breakdown"""
        response = requests.get(f"{BASE_URL}/api/admin/birthday-box-orders")
        assert response.status_code == 200
        data = response.json()
        counts = data.get("counts", {})
        assert "total" in counts, "Missing 'total' in counts"
        assert "new" in counts, "Missing 'new' in counts"
        assert "in_progress" in counts, "Missing 'in_progress' in counts"
        assert "assembled" in counts, "Missing 'assembled' in counts"
        assert "dispatched" in counts, "Missing 'dispatched' in counts"
        assert "delivered" in counts, "Missing 'delivered' in counts"
        print(f"✓ Counts: {counts}")

    def test_list_orders_new_count_is_correct(self):
        """New orders count should be >= 20 (28 orders, mostly new/pending_concierge)"""
        response = requests.get(f"{BASE_URL}/api/admin/birthday-box-orders?limit=200")
        assert response.status_code == 200
        data = response.json()
        new_count = data.get("counts", {}).get("new", 0)
        assert new_count >= 20, f"Expected at least 20 new orders, got {new_count}"
        print(f"✓ New orders count: {new_count}")

    def test_list_orders_has_orders_array(self):
        """Response should have orders array"""
        response = requests.get(f"{BASE_URL}/api/admin/birthday-box-orders")
        assert response.status_code == 200
        data = response.json()
        assert "orders" in data, "Missing 'orders' in response"
        assert isinstance(data["orders"], list), "orders should be a list"
        print(f"✓ Orders array present with {len(data['orders'])} orders")

    def test_list_orders_have_required_fields(self):
        """Each order should have required fields"""
        response = requests.get(f"{BASE_URL}/api/admin/birthday-box-orders?limit=5")
        assert response.status_code == 200
        data = response.json()
        orders = data.get("orders", [])
        assert len(orders) > 0, "No orders found"

        for order in orders:
            assert "id" in order, f"Order missing 'id': {order.keys()}"
            assert "status" in order, f"Order missing 'status'"
            assert "pet_name" in order, f"Order missing 'pet_name'"
            assert "hasAllergies" in order, f"Order missing 'hasAllergies'"
        print(f"✓ All orders have required fields")

    def test_list_orders_allergy_flag(self):
        """Orders with allergies should have hasAllergies=True"""
        response = requests.get(f"{BASE_URL}/api/admin/birthday-box-orders?limit=200")
        assert response.status_code == 200
        data = response.json()
        orders = data.get("orders", [])
        allergic_orders = [o for o in orders if o.get("allergies")]
        flagged_orders = [o for o in orders if o.get("hasAllergies")]
        assert len(allergic_orders) == len(flagged_orders), \
            f"Mismatch: {len(allergic_orders)} orders with allergies, {len(flagged_orders)} flagged"
        print(f"✓ hasAllergies flag correct: {len(flagged_orders)} allergic orders")

    def test_list_orders_status_filter(self):
        """Status filter should work"""
        response = requests.get(f"{BASE_URL}/api/admin/birthday-box-orders?status=pending_concierge")
        assert response.status_code == 200
        data = response.json()
        orders = data.get("orders", [])
        for order in orders:
            assert order["status"] == "pending_concierge", \
                f"Expected pending_concierge, got {order['status']}"
        print(f"✓ Status filter works: {len(orders)} pending_concierge orders")


class TestGetBirthdayBoxOrderDetail:
    """Tests for GET /api/admin/birthday-box-orders/{order_id}"""

    def _get_first_order_id(self):
        """Helper: get first order ID from list"""
        response = requests.get(f"{BASE_URL}/api/admin/birthday-box-orders?limit=5")
        assert response.status_code == 200
        orders = response.json().get("orders", [])
        assert len(orders) > 0, "No orders to test with"
        return orders[0]["id"]

    def test_get_order_detail_returns_200(self):
        """GET order detail returns 200"""
        order_id = self._get_first_order_id()
        response = requests.get(f"{BASE_URL}/api/admin/birthday-box-orders/{order_id}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text[:200]}"
        print(f"✓ Order detail returns 200 for {order_id}")

    def test_get_order_detail_has_slots(self):
        """Order detail should have 6-slot manifest"""
        order_id = self._get_first_order_id()
        response = requests.get(f"{BASE_URL}/api/admin/birthday-box-orders/{order_id}")
        assert response.status_code == 200
        order = response.json()
        slots = order.get("slots", [])
        assert len(slots) == 6, f"Expected 6 slots, got {len(slots)}"
        print(f"✓ Order has {len(slots)} slots")

    def test_get_order_detail_has_allergy_info(self):
        """Order detail should have allergy information"""
        order_id = self._get_first_order_id()
        response = requests.get(f"{BASE_URL}/api/admin/birthday-box-orders/{order_id}")
        assert response.status_code == 200
        order = response.json()
        assert "allergies" in order, "Order missing 'allergies' field"
        print(f"✓ Order has allergies: {order.get('allergies')}")

    def test_get_order_detail_unknown_returns_404(self):
        """Unknown order ID should return 404"""
        response = requests.get(f"{BASE_URL}/api/admin/birthday-box-orders/nonexistent-order-xyz")
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Unknown order returns 404")

    def test_get_order_detail_has_ticket_id(self):
        """Order detail should include ticket_id"""
        order_id = self._get_first_order_id()
        response = requests.get(f"{BASE_URL}/api/admin/birthday-box-orders/{order_id}")
        assert response.status_code == 200
        order = response.json()
        assert "ticket_id" in order, "Order missing 'ticket_id'"
        print(f"✓ Order has ticket_id: {order.get('ticket_id')}")


class TestStatusTransition:
    """Tests for PATCH /api/admin/birthday-box-orders/{id}/status"""

    def _get_new_order_id(self):
        """Helper: get an order that's new/pending_concierge"""
        response = requests.get(f"{BASE_URL}/api/admin/birthday-box-orders?limit=200")
        assert response.status_code == 200
        orders = response.json().get("orders", [])
        for order in orders:
            if order.get("status") in ["new", "pending_concierge"]:
                return order["id"]
        pytest.skip("No new orders available to test status transition")

    def test_status_transition_to_in_progress(self):
        """PATCH status to in_progress should return success"""
        order_id = self._get_new_order_id()
        response = requests.patch(
            f"{BASE_URL}/api/admin/birthday-box-orders/{order_id}/status",
            json={"status": "in_progress", "concierge_name": "test_concierge"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text[:200]}"
        data = response.json()
        assert data.get("success") == True, f"Expected success=True, got: {data}"
        assert data.get("status") == "in_progress", f"Expected status=in_progress, got: {data.get('status')}"
        print(f"✓ Status transition to in_progress succeeded for {order_id}")

        # Verify in DB by fetching the order
        get_response = requests.get(f"{BASE_URL}/api/admin/birthday-box-orders/{order_id}")
        assert get_response.status_code == 200
        updated_order = get_response.json()
        assert updated_order.get("status") == "in_progress", \
            f"DB not updated. Expected in_progress, got: {updated_order.get('status')}"
        print(f"✓ Status in_progress verified in DB")

        # Reset the status back (cleanup)
        requests.patch(
            f"{BASE_URL}/api/admin/birthday-box-orders/{order_id}/status",
            json={"status": "pending_concierge", "concierge_name": "test_cleanup"}
        )

    def test_status_transition_invalid_status(self):
        """PATCH with invalid status should return 400"""
        order_id = self._get_new_order_id()
        response = requests.patch(
            f"{BASE_URL}/api/admin/birthday-box-orders/{order_id}/status",
            json={"status": "invalid_status_xyz", "concierge_name": "test"}
        )
        assert response.status_code == 400, f"Expected 400, got {response.status_code}: {response.text[:200]}"
        print("✓ Invalid status returns 400")

    def test_status_transition_unknown_order(self):
        """PATCH status for unknown order should return 404"""
        response = requests.patch(
            f"{BASE_URL}/api/admin/birthday-box-orders/nonexistent-order-xyz/status",
            json={"status": "in_progress", "concierge_name": "test"}
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Unknown order status update returns 404")


class TestSlotAssembly:
    """Tests for PATCH /api/admin/birthday-box-orders/{id}/slot/{n}/assemble"""

    def _get_order_id(self):
        """Helper: get any order ID"""
        response = requests.get(f"{BASE_URL}/api/admin/birthday-box-orders?limit=5")
        assert response.status_code == 200
        orders = response.json().get("orders", [])
        assert len(orders) > 0
        return orders[0]["id"]

    def test_assemble_slot_1(self):
        """PATCH slot 1 as assembled should return success"""
        order_id = self._get_order_id()
        response = requests.patch(
            f"{BASE_URL}/api/admin/birthday-box-orders/{order_id}/slot/1/assemble",
            json={"assembled": True, "concierge_name": "test_concierge"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text[:200]}"
        data = response.json()
        assert data.get("success") == True, f"Expected success=True, got: {data}"
        assert data.get("slot_number") == 1, f"Expected slot_number=1"
        assert data.get("assembled") == True, f"Expected assembled=True"
        assert "assembled_count" in data, "Missing assembled_count"
        assert "total_slots" in data, "Missing total_slots"
        assert "all_assembled" in data, "Missing all_assembled"
        print(f"✓ Slot 1 assembled: assembled_count={data['assembled_count']}/{data['total_slots']}")

    def test_assemble_and_unassemble_slot(self):
        """Toggle slot assembly state"""
        order_id = self._get_order_id()

        # Assemble slot 2
        assemble_res = requests.patch(
            f"{BASE_URL}/api/admin/birthday-box-orders/{order_id}/slot/2/assemble",
            json={"assembled": True, "concierge_name": "test"}
        )
        assert assemble_res.status_code == 200
        data = assemble_res.json()
        assert data.get("assembled") == True
        count_after_assemble = data.get("assembled_count", 0)

        # Unassemble slot 2
        unassemble_res = requests.patch(
            f"{BASE_URL}/api/admin/birthday-box-orders/{order_id}/slot/2/assemble",
            json={"assembled": False, "concierge_name": "test"}
        )
        assert unassemble_res.status_code == 200
        unassemble_data = unassemble_res.json()
        assert unassemble_data.get("assembled") == False
        count_after_unassemble = unassemble_data.get("assembled_count", 0)

        print(f"✓ Slot toggle: assembled_count went from {count_after_assemble} to {count_after_unassemble}")

    def test_assemble_all_6_slots(self):
        """Assembling all 6 slots should set all_assembled=True"""
        response = requests.get(f"{BASE_URL}/api/admin/birthday-box-orders?limit=200")
        orders = response.json().get("orders", [])
        # find orders with 6 slots
        order = next((o for o in orders if o.get("slotCount") == 6), None)
        if not order:
            pytest.skip("No 6-slot order available")

        order_id = order["id"]

        # Assemble all 6 slots
        for slot_num in range(1, 7):
            res = requests.patch(
                f"{BASE_URL}/api/admin/birthday-box-orders/{order_id}/slot/{slot_num}/assemble",
                json={"assembled": True, "concierge_name": "test"}
            )
            assert res.status_code == 200

        # Check final state
        final_res = requests.patch(
            f"{BASE_URL}/api/admin/birthday-box-orders/{order_id}/slot/6/assemble",
            json={"assembled": True, "concierge_name": "test"}
        )
        assert final_res.status_code == 200
        final_data = final_res.json()
        assert final_data.get("all_assembled") == True, \
            f"Expected all_assembled=True after 6 slots, got: {final_data}"
        print(f"✓ All 6 slots assembled: all_assembled=True")

        # Reset - unassemble all slots
        for slot_num in range(1, 7):
            requests.patch(
                f"{BASE_URL}/api/admin/birthday-box-orders/{order_id}/slot/{slot_num}/assemble",
                json={"assembled": False, "concierge_name": "test_cleanup"}
            )


class TestAddNote:
    """Tests for POST /api/admin/birthday-box-orders/{id}/note"""

    def _get_order_id(self):
        """Helper: get any order ID"""
        response = requests.get(f"{BASE_URL}/api/admin/birthday-box-orders?limit=5")
        assert response.status_code == 200
        orders = response.json().get("orders", [])
        assert len(orders) > 0
        return orders[0]["id"]

    def test_add_note_returns_200(self):
        """POST note should return 200"""
        order_id = self._get_order_id()
        response = requests.post(
            f"{BASE_URL}/api/admin/birthday-box-orders/{order_id}/note",
            json={"note": "TEST_NOTE: Verified cake flavor with customer", "concierge_name": "test_concierge"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text[:200]}"
        data = response.json()
        assert data.get("success") == True, f"Expected success=True, got: {data}"
        assert data.get("note") == "TEST_NOTE: Verified cake flavor with customer"
        assert "timestamp" in data
        print(f"✓ Note added successfully at {data.get('timestamp')}")

    def test_add_note_persists_in_db(self):
        """Note should be visible in order detail after adding"""
        order_id = self._get_order_id()
        note_text = "TEST_DB_PERSIST: Delivery scheduled for evening"

        # Add note
        post_res = requests.post(
            f"{BASE_URL}/api/admin/birthday-box-orders/{order_id}/note",
            json={"note": note_text, "concierge_name": "test"}
        )
        assert post_res.status_code == 200

        # Verify in DB
        get_res = requests.get(f"{BASE_URL}/api/admin/birthday-box-orders/{order_id}")
        assert get_res.status_code == 200
        order = get_res.json()
        notes = order.get("notes", [])
        note_texts = [n.get("note") for n in notes]
        assert note_text in note_texts, f"Note not found in DB. notes: {note_texts}"
        print(f"✓ Note persisted in DB: '{note_text}'")

    def test_add_note_unknown_order_returns_404(self):
        """POST note for unknown order should return 404"""
        response = requests.post(
            f"{BASE_URL}/api/admin/birthday-box-orders/nonexistent-order-xyz/note",
            json={"note": "test", "concierge_name": "test"}
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Unknown order note returns 404")


class TestAllergyConfirm:
    """Tests for POST /api/admin/birthday-box-orders/{id}/allergy-confirm"""

    def _get_allergic_order_id(self):
        """Helper: get an order with allergies"""
        response = requests.get(f"{BASE_URL}/api/admin/birthday-box-orders?limit=200")
        assert response.status_code == 200
        orders = response.json().get("orders", [])
        for order in orders:
            if order.get("hasAllergies") and not order.get("allergy_confirmed"):
                return order["id"]
        pytest.skip("No unconfirmed allergic order available")

    def test_allergy_confirm_returns_200(self):
        """POST allergy-confirm should return 200"""
        order_id = self._get_allergic_order_id()
        response = requests.post(
            f"{BASE_URL}/api/admin/birthday-box-orders/{order_id}/allergy-confirm",
            json={"concierge_name": "test_concierge"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text[:200]}"
        data = response.json()
        assert data.get("success") == True, f"Expected success=True, got: {data}"
        assert "confirmed_by" in data
        assert "confirmed_at" in data
        print(f"✓ Allergy confirmed by {data.get('confirmed_by')} at {data.get('confirmed_at')}")

    def test_allergy_confirm_persists_in_db(self):
        """allergy_confirmed should be True in DB after confirmation"""
        response = requests.get(f"{BASE_URL}/api/admin/birthday-box-orders?limit=200")
        orders = response.json().get("orders", [])
        order = next((o for o in orders if o.get("hasAllergies")), None)
        if not order:
            pytest.skip("No allergic order available")
        
        order_id = order["id"]

        # Confirm allergy
        requests.post(
            f"{BASE_URL}/api/admin/birthday-box-orders/{order_id}/allergy-confirm",
            json={"concierge_name": "test"}
        )

        # Verify in DB
        get_res = requests.get(f"{BASE_URL}/api/admin/birthday-box-orders/{order_id}")
        assert get_res.status_code == 200
        updated_order = get_res.json()
        assert updated_order.get("allergy_confirmed") == True, \
            f"Expected allergy_confirmed=True, got: {updated_order.get('allergy_confirmed')}"
        print(f"✓ allergy_confirmed=True in DB")

    def test_allergy_confirm_unknown_order(self):
        """POST allergy-confirm for unknown order should return 404"""
        response = requests.post(
            f"{BASE_URL}/api/admin/birthday-box-orders/nonexistent-order-xyz/allergy-confirm",
            json={"concierge_name": "test"}
        )
        assert response.status_code == 404, f"Expected 404, got {response.status_code}"
        print("✓ Unknown order allergy-confirm returns 404")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
