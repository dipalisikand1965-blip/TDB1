"""
Test suite for The Doggy Company - Intent-to-Ticket Flow
Tests: service desk ticket creation via tdc.* methods, admin inbox, user inbox
"""

import pytest
import requests
import os
import json

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
USER_EMAIL = "dipali@clubconcierge.in"
USER_PASSWORD = "test123"
ADMIN_USER = "aditya"
ADMIN_PASSWORD = "lola4304"
USER_ID = "55affb42-68ac-4e5d-ba17-7ddc49611556"


@pytest.fixture(scope="module")
def user_token():
    """Get dipali user auth token"""
    resp = requests.post(f"{BASE_URL}/api/auth/login", json={
        "email": USER_EMAIL,
        "password": USER_PASSWORD
    })
    assert resp.status_code == 200, f"User login failed: {resp.text[:200]}"
    data = resp.json()
    token = data.get("access_token") or data.get("token")
    assert token, "No token in login response"
    print(f"User logged in: {data.get('user', {}).get('name')}")
    return token


@pytest.fixture(scope="module")
def pet_id(user_token):
    """Get first pet ID for dipali"""
    resp = requests.get(
        f"{BASE_URL}/api/pets",
        headers={"Authorization": f"Bearer {user_token}"}
    )
    assert resp.status_code == 200, f"Pets fetch failed: {resp.text[:200]}"
    data = resp.json()
    pets = data.get("pets", data) if isinstance(data, dict) else data
    if isinstance(pets, list) and pets:
        pid = pets[0].get("id") or pets[0].get("_id")
        print(f"Pet ID: {pid}, Name: {pets[0].get('name')}")
        return pid
    pytest.skip("No pets found for user")


@pytest.fixture(scope="module")
def admin_token():
    """Get admin auth token"""
    resp = requests.post(f"{BASE_URL}/api/admin/login", json={
        "username": ADMIN_USER,
        "password": ADMIN_PASSWORD
    })
    assert resp.status_code == 200, f"Admin login failed: {resp.text[:200]}"
    data = resp.json()
    token = data.get("access_token") or data.get("token")
    assert token, "No admin token in login response"
    return token


def create_ticket(user_token, user_id, pet_id_val, pillar, intent, channel, urgency, status, life_state, message):
    """Helper to create a service desk ticket"""
    body = {
        "parent_id": user_id,
        "pet_id": pet_id_val,
        "pillar": pillar,
        "intent_primary": intent,
        "channel": channel,
        "urgency": urgency,
        "status": status,
        "life_state": life_state,
        "initial_message": {
            "sender": "system",
            "text": message,
            "metadata": {"auto_tracked": True, "channel": channel}
        }
    }
    return requests.post(
        f"{BASE_URL}/api/service_desk/attach_or_create_ticket",
        json=body,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {user_token}"
        }
    )


class TestServiceDeskTicketCreation:
    """Test the core /api/service_desk/attach_or_create_ticket endpoint"""

    def test_visit_intent_ticket_browse(self, user_token, pet_id):
        """tdc.visit() → browse_intent ticket for /care"""
        resp = create_ticket(
            user_token, USER_ID, pet_id,
            pillar="care",
            intent="browse_intent",
            channel="care_pillar_page",
            urgency="low",
            status="open",
            life_state="EXPLORE",
            message="Mojo's parent visited /care"
        )
        print(f"browse_intent status: {resp.status_code}, body: {resp.text[:300]}")
        assert resp.status_code in [200, 201], f"Expected 200/201, got {resp.status_code}: {resp.text[:300]}"

        data = resp.json()
        ticket_id = data.get("ticket_id") or data.get("id")
        assert ticket_id, "No ticket_id in response"
        print(f"[PASS] browse_intent ticket: {ticket_id}, is_new={data.get('is_new')}")

    def test_booking_intent_ticket_services(self, user_token, pet_id):
        """tdc.book() → booking_intent ticket for Services page"""
        resp = create_ticket(
            user_token, USER_ID, pet_id,
            pillar="services",
            intent="booking_intent",
            channel="services_pillar_page",
            urgency="high",
            status="open",
            life_state="PLAN",
            message="Mojo's parent wants to book: Full Grooming via services_pillar_page"
        )
        print(f"booking_intent status: {resp.status_code}")
        assert resp.status_code in [200, 201], f"Got {resp.status_code}: {resp.text[:300]}"

        data = resp.json()
        ticket_id = data.get("ticket_id") or data.get("id")
        assert ticket_id, "No ticket_id in response"
        print(f"[PASS] booking_intent ticket: {ticket_id}")

    def test_emergency_urgent_ticket(self, user_token, pet_id):
        """tdc.urgent() → emergency_alert ticket with urgency=emergency"""
        resp = create_ticket(
            user_token, USER_ID, pet_id,
            pillar="emergency",
            intent="emergency_alert",
            channel="emergency_pillar",
            urgency="emergency",
            status="urgent",
            life_state="CONCERN",
            message="URGENT — Mojo: Emergency Vet Consultation"
        )
        print(f"emergency_alert status: {resp.status_code}")
        assert resp.status_code in [200, 201], f"Got {resp.status_code}: {resp.text[:300]}"

        data = resp.json()
        ticket_id = data.get("ticket_id") or data.get("id")
        assert ticket_id, "No ticket_id for emergency"
        print(f"[PASS] emergency_alert ticket: {ticket_id}")

    def test_mira_chat_intent_ticket(self, user_token, pet_id):
        """tdc.chat() → mira_chat_intent ticket from Mira widget"""
        resp = create_ticket(
            user_token, USER_ID, pet_id,
            pillar="mira_os",
            intent="mira_chat_intent",
            channel="mira_chat_widget",
            urgency="medium",
            status="open",
            life_state="EXPLORE",
            message="Mojo's parent chatted with Mira: \"What grooming services do you offer?\""
        )
        print(f"mira_chat_intent status: {resp.status_code}")
        assert resp.status_code in [200, 201], f"Got {resp.status_code}: {resp.text[:300]}"

        data = resp.json()
        ticket_id = data.get("ticket_id") or data.get("id")
        assert ticket_id, "No ticket_id for chat"
        print(f"[PASS] mira_chat_intent ticket: {ticket_id}")

    def test_celebrate_view_ticket(self, user_token, pet_id):
        """tdc.view() → product_interest ticket when clicking celebrate category pill"""
        resp = create_ticket(
            user_token, USER_ID, pet_id,
            pillar="celebrate",
            intent="product_interest",
            channel="celebrate_category_pill",
            urgency="low",
            status="open",
            life_state="CELEBRATE",
            message="Mojo's parent viewed: Birthday Cakes on /celebrate"
        )
        print(f"product_interest status: {resp.status_code}")
        assert resp.status_code in [200, 201], f"Got {resp.status_code}: {resp.text[:300]}"

        data = resp.json()
        ticket_id = data.get("ticket_id") or data.get("id")
        assert ticket_id, "No ticket_id for celebrate view"
        print(f"[PASS] product_interest ticket: {ticket_id}")


class TestTicketRetrieval:
    """Test fetching tickets for user and admin"""

    def test_user_tickets_by_parent(self, user_token):
        """User should be able to get their tickets via /tickets/by_parent/{id}"""
        resp = requests.get(
            f"{BASE_URL}/api/service_desk/tickets/by_parent/{USER_ID}",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        print(f"tickets/by_parent status: {resp.status_code}")
        assert resp.status_code == 200, f"Got {resp.status_code}: {resp.text[:200]}"

        data = resp.json()
        tickets = data.get("tickets") or (data if isinstance(data, list) else [])
        print(f"[PASS] User has {len(tickets)} tickets")
        assert len(tickets) > 0, "User should have at least 1 ticket after creation tests"

        # Verify first ticket has pet info (not 'Unknown user')
        if tickets:
            t = tickets[0]
            assert t.get("pet_id"), f"First ticket missing pet_id: {t}"
            assert t.get("parent_id") == USER_ID, f"parent_id mismatch in ticket"
            print(f"[PASS] First ticket pet_id={t.get('pet_id')}, pillar={t.get('pillar')}")

    def test_admin_can_see_tickets_queue(self, admin_token):
        """Admin can see ticket queues"""
        resp = requests.get(
            f"{BASE_URL}/api/service_desk/tickets/queue/inbox",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        print(f"Admin queue status: {resp.status_code}")
        assert resp.status_code == 200, f"Got {resp.status_code}: {resp.text[:200]}"

        data = resp.json()
        print(f"[PASS] Admin inbox queue: {json.dumps(data)[:300]}")

    def test_single_ticket_fetch(self, user_token):
        """Fetch a single ticket by ticket_id"""
        # First create a ticket to get an ID
        resp = create_ticket(
            user_token, USER_ID, "pet-mojo-7327ad56",
            pillar="services",
            intent="booking_intent",
            channel="services_test",
            urgency="high",
            status="open",
            life_state="PLAN",
            message="TEST - single ticket fetch test"
        )
        assert resp.status_code in [200, 201]
        ticket_id = resp.json().get("ticket_id") or resp.json().get("id")

        # Now fetch it
        get_resp = requests.get(
            f"{BASE_URL}/api/service_desk/ticket/{ticket_id}",
            headers={"Authorization": f"Bearer {user_token}"}
        )
        print(f"Single ticket fetch status: {get_resp.status_code}")
        assert get_resp.status_code == 200, f"Got {get_resp.status_code}: {get_resp.text[:200]}"

        ticket = get_resp.json()
        assert ticket.get("ticket_id") == ticket_id, "ticket_id mismatch in fetched ticket"
        assert ticket.get("pet_id"), "ticket missing pet_id"
        print(f"[PASS] Ticket {ticket_id}: pillar={ticket.get('pillar')}, pet_id={ticket.get('pet_id')}")


class TestAdminLogin:
    """Test admin authentication"""

    def test_admin_login_succeeds(self):
        """Admin login with aditya/lola4304"""
        resp = requests.post(f"{BASE_URL}/api/admin/login", json={
            "username": ADMIN_USER,
            "password": ADMIN_PASSWORD
        })
        print(f"Admin login status: {resp.status_code}")
        assert resp.status_code == 200, f"Admin login failed: {resp.text[:300]}"

        data = resp.json()
        token = data.get("access_token") or data.get("token")
        assert token, "No token in admin login response"
        print(f"[PASS] Admin login successful")
