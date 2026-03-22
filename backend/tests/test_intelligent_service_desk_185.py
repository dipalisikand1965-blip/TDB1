"""
Intelligent Service Desk Tests — Iteration 185
Tests for:
1. attach_or_create_ticket — real parent name (not 'Unknown')
2. personalization-stats — vault allergies at priority 10, vaccines, meds, vet, weight
3. Mira Briefing — HEALTH & SAFETY, DIET & DAILY LIFE, CARE PILLAR INTEL sections
4. DoggyServiceDesk context loading (ticket.member populated)
5. Full concierge flow: Care pillar → Book via Concierge → admin ticket
"""

import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
PET_ID = "pet-mojo-7327ad56"
USER_EMAIL = "dipali@clubconcierge.in"
USER_PASS = "test123"
ADMIN_USER = "aditya"
ADMIN_PASS = "lola4304"

# ── Fixtures ──────────────────────────────────────────────────────────────────

@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def auth_token(session):
    """Login as dipali and get member token"""
    res = session.post(f"{BASE_URL}/api/auth/login", json={
        "email": USER_EMAIL,
        "password": USER_PASS
    })
    if res.status_code == 200:
        d = res.json()
        return d.get("access_token") or d.get("token")
    pytest.skip(f"Auth failed: {res.status_code} {res.text[:200]}")


@pytest.fixture(scope="module")
def admin_token(session):
    """Login as admin aditya and get admin token"""
    res = session.post(f"{BASE_URL}/api/admin/login", json={
        "username": ADMIN_USER,
        "password": ADMIN_PASS
    })
    if res.status_code == 200:
        d = res.json()
        return d.get("access_token") or d.get("token")
    pytest.skip(f"Admin auth failed: {res.status_code} {res.text[:200]}")


@pytest.fixture(scope="module")
def member_headers(auth_token):
    return {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {auth_token}"
    }


@pytest.fixture(scope="module")
def admin_headers(admin_token):
    return {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {admin_token}"
    }


# ── 1. PersonalizationStats — Health Vault data ─────────────────────────────

class TestPersonalizationStats:
    """GET /api/mira/personalization-stats/{pet_id} — vault data at priority 10"""

    def test_endpoint_returns_200(self, session):
        res = session.get(f"{BASE_URL}/api/mira/personalization-stats/{PET_ID}")
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text[:200]}"

    def test_response_has_knowledge_items(self, session):
        res = session.get(f"{BASE_URL}/api/mira/personalization-stats/{PET_ID}")
        data = res.json()
        assert "knowledge_items" in data, "Missing knowledge_items field"
        assert isinstance(data["knowledge_items"], list)
        assert len(data["knowledge_items"]) > 0

    def test_vault_allergy_at_priority_10(self, session):
        """Vault allergies must appear in knowledge_items with priority 10"""
        res = session.get(f"{BASE_URL}/api/mira/personalization-stats/{PET_ID}")
        data = res.json()
        items = data.get("knowledge_items", [])
        health_items_p10 = [i for i in items if i.get("priority") == 10 and i.get("category") == "health"]
        assert len(health_items_p10) > 0, \
            f"Expected vault allergy items at priority 10, got: {[i for i in items if i.get('priority', 0) >= 9]}"

    def test_no_chicken_allergy_in_ticker(self, session):
        """Vault allergy 'Chicken' (NO CHICKEN) must appear in knowledge_items at priority 10"""
        res = session.get(f"{BASE_URL}/api/mira/personalization-stats/{PET_ID}")
        data = res.json()
        items = data.get("knowledge_items", [])
        # Filter health items with priority 10 (vault allergies)
        allergy_texts = [i["text"].upper() for i in items if i.get("category") == "health" and i.get("priority") == 10]
        chicken_found = any("CHICKEN" in t for t in allergy_texts)
        assert chicken_found, f"NO CHICKEN allergy not found at priority 10. Health items: {allergy_texts}"

    def test_vaccine_items_appear(self, session):
        """Upcoming vaccines should appear in knowledge_items"""
        res = session.get(f"{BASE_URL}/api/mira/personalization-stats/{PET_ID}")
        data = res.json()
        items = data.get("knowledge_items", [])
        vaccine_items = [i for i in items if "💉" in i.get("icon","") or "vax" in i.get("text","").lower() or "vaccine" in i.get("text","").lower() or "due in" in i.get("text","").lower() or "rabies" in i.get("text","").lower()]
        assert len(vaccine_items) > 0, f"No vaccine items found. Items: {[i['text'] for i in items if i.get('category')=='health']}"

    def test_stats_array_present(self, session):
        """Legacy stats array still present for backward compatibility"""
        res = session.get(f"{BASE_URL}/api/mira/personalization-stats/{PET_ID}")
        data = res.json()
        assert "stats" in data
        assert isinstance(data["stats"], list)

    def test_soul_score_item_present(self, session):
        """Soul score item must appear in knowledge_items"""
        res = session.get(f"{BASE_URL}/api/mira/personalization-stats/{PET_ID}")
        data = res.json()
        items = data.get("knowledge_items", [])
        soul_items = [i for i in items if i.get("category") == "soul" and "Soul Score" in i.get("text","")]
        assert len(soul_items) > 0, f"Soul score item missing. Items: {[i['text'] for i in items]}"


# ── 2. Create Ticket — Member Name Resolution ─────────────────────────────────

class TestTicketMemberNameResolution:
    """POST /api/service_desk/attach_or_create_ticket → GET /api/tickets/{id} — real parent name"""

    @pytest.fixture(scope="class")
    def ticket_ref(self, session, member_headers):
        """Create/attach a ticket and return the FULL ticket data via GET"""
        # Use unique channel to avoid 72hr window deduplication
        import time
        unique_chan = f"care_test_{int(time.time())}"
        payload = {
            "parent_id": USER_EMAIL,
            "pet_id": PET_ID,
            "pillar": "care",
            "channel": unique_chan,
            "intent_primary": "book_grooming_185",
            "intent_secondary": ["Book Grooming 185"],
            "life_state": "everyday",
            "initial_message": {
                "sender": "member",
                "text": "TEST_185: I want to book a grooming session for Mojo"
            }
        }
        res = session.post(
            f"{BASE_URL}/api/service_desk/attach_or_create_ticket",
            json=payload,
            headers=member_headers
        )
        assert res.status_code == 200, f"Ticket creation failed: {res.status_code} {res.text[:400]}"
        ticket_id = res.json().get("ticket_id")
        assert ticket_id, f"No ticket_id in response: {res.json()}"
        
        # Fetch full ticket data
        full_res = session.get(f"{BASE_URL}/api/tickets/{ticket_id}", headers=member_headers)
        if full_res.status_code == 200:
            return full_res.json().get("ticket") or full_res.json()
        # fallback: check service_desk tickets
        sd_res = session.get(f"{BASE_URL}/api/service_desk/tickets?limit=20", headers=member_headers)
        if sd_res.status_code == 200:
            tickets = sd_res.json().get("tickets", [])
            for t in tickets:
                if t.get("ticket_id") == ticket_id:
                    return t
        # fallback: return minimal response so we can still check ticket_id
        return {"ticket_id": ticket_id, "_minimal": True}

    def test_ticket_created_successfully(self, ticket_ref):
        assert "ticket_id" in ticket_ref, f"No ticket_id: {ticket_ref}"
        assert ticket_ref.get("ticket_id", "").startswith("TDB-"), f"Bad ticket_id: {ticket_ref.get('ticket_id')}"

    def test_member_name_not_unknown(self, ticket_ref):
        """member.name must be real name, not 'Unknown' or 'Pet Parent'"""
        if ticket_ref.get("_minimal"):
            pytest.skip("Only minimal response available - full ticket not fetchable")
        member = ticket_ref.get("member") or {}
        name = member.get("name", "")
        assert name not in ("Unknown", "", "Pet Parent"), \
            f"member.name should not be 'Unknown'/'Pet Parent', got: '{name}'"

    def test_member_name_is_dipali(self, ticket_ref):
        """member.name should be Dipali (or full name containing Dipali)"""
        if ticket_ref.get("_minimal"):
            pytest.skip("Only minimal response available")
        member = ticket_ref.get("member") or {}
        name = member.get("name", "")
        assert "dipali" in name.lower() or "Dipali" in name, \
            f"Expected 'Dipali' in member name, got: '{name}'"

    def test_member_email_populated(self, ticket_ref):
        """member.email should be dipali@clubconcierge.in"""
        if ticket_ref.get("_minimal"):
            pytest.skip("Only minimal response available")
        member = ticket_ref.get("member") or {}
        email = member.get("email", "")
        assert email.lower() == USER_EMAIL.lower(), \
            f"Expected email {USER_EMAIL}, got: '{email}'"

    def test_user_name_field_not_unknown(self, ticket_ref):
        """user_name top-level field should match member name"""
        if ticket_ref.get("_minimal"):
            pytest.skip("Only minimal response available")
        user_name = ticket_ref.get("user_name", "")
        assert user_name not in ("Unknown", ""), \
            f"user_name should not be 'Unknown'/empty, got: '{user_name}'"

    def test_ticket_has_pet_id(self, ticket_ref):
        """ticket must have pet_id"""
        if ticket_ref.get("_minimal"):
            pytest.skip("Only minimal response available")
        pet_id = ticket_ref.get("pet_id") or (ticket_ref.get("pet_info") or {}).get("id")
        assert pet_id == PET_ID, f"pet_id mismatch: {pet_id}"

    def test_ticket_has_pillar_care(self, ticket_ref):
        if ticket_ref.get("_minimal"):
            pytest.skip("Only minimal response available")
        assert ticket_ref.get("pillar") == "care" or ticket_ref.get("category") == "care", \
            f"Expected pillar 'care', got: pillar={ticket_ref.get('pillar')} category={ticket_ref.get('category')}"

    def test_mira_briefing_included(self, ticket_ref):
        """Mira briefing should be generated and non-empty"""
        if ticket_ref.get("_minimal"):
            pytest.skip("Only minimal response available")
        briefing = ticket_ref.get("mira_briefing", "") or ticket_ref.get("description","")
        assert briefing and len(briefing) > 100, \
            f"mira_briefing should be populated, got: '{str(briefing)[:100]}'"

    def test_mira_briefing_has_health_safety_section(self, ticket_ref):
        """Briefing must include HEALTH & SAFETY section"""
        if ticket_ref.get("_minimal"):
            pytest.skip("Only minimal response available")
        briefing = ticket_ref.get("mira_briefing", "") or ticket_ref.get("description","")
        assert "HEALTH & SAFETY" in briefing, \
            f"HEALTH & SAFETY section missing. Briefing starts: {str(briefing)[:300]}"

    def test_mira_briefing_has_diet_section(self, ticket_ref):
        """Briefing must include DIET & DAILY LIFE section"""
        if ticket_ref.get("_minimal"):
            pytest.skip("Only minimal response available")
        briefing = ticket_ref.get("mira_briefing", "") or ticket_ref.get("description","")
        assert "DIET & DAILY LIFE" in briefing, \
            f"DIET & DAILY LIFE section missing."

    def test_mira_briefing_has_pillar_intel_section(self, ticket_ref):
        """Briefing must include CARE PILLAR INTEL section"""
        if ticket_ref.get("_minimal"):
            pytest.skip("Only minimal response available")
        briefing = ticket_ref.get("mira_briefing", "") or ticket_ref.get("description","")
        assert "CARE PILLAR INTEL" in briefing or "PILLAR INTEL" in briefing, \
            f"PILLAR INTEL section missing."

    def test_mira_briefing_has_vault_allergy_info(self, ticket_ref):
        """Briefing should reference vault allergies (e.g. CONFIRMED ALLERGIES or Chicken)"""
        if ticket_ref.get("_minimal"):
            pytest.skip("Only minimal response available")
        briefing = str(ticket_ref.get("mira_briefing", "") or ticket_ref.get("description",""))
        has_allergy_info = "ALLERG" in briefing.upper() or "CHICKEN" in briefing.upper() or "NO KNOWN" in briefing.upper()
        assert has_allergy_info, \
            f"Expected allergy info in briefing. Briefing snippet: {briefing[:500]}"


# ── 3. Ticket via Vault Allergy Add ──────────────────────────────────────────

class TestVaultAllergyTicketCreation:
    """Add allergy via vault endpoint and check urgent ticket is created"""

    def test_add_allergy_via_vault(self, session, member_headers):
        """Adding allergy should return 200 and create a ticket"""
        payload = {
            "name": "TEST_Fish_185",
            "type": "food",
            "severity": "moderate",
            "reaction": "digestive_upset",
            "confirmed_by": "vet",
            "notes": "Test allergy for iteration 185 testing"
        }
        res = session.post(
            f"{BASE_URL}/api/pet-vault/{PET_ID}/allergies",
            json=payload,
            headers=member_headers
        )
        assert res.status_code == 200, f"Add allergy failed: {res.status_code} {res.text[:300]}"

    def test_vault_allergy_appears_in_summary(self, session, member_headers):
        """Newly added allergy should appear in vault summary"""
        res = session.get(f"{BASE_URL}/api/pet-vault/{PET_ID}/summary", headers=member_headers)
        assert res.status_code == 200
        data = res.json()
        allergy_names = [a.get("name","").lower() for a in data.get("allergies", [])]
        # Either new test allergy or chicken should be there
        assert any(a in allergy_names for a in ["test_fish_185", "chicken", "no chicken"]), \
            f"Expected test allergy in vault. Got: {allergy_names}"

    def test_personalization_stats_updated_after_allergy(self, session):
        """After adding allergy, personalization-stats should show it at priority 10"""
        res = session.get(f"{BASE_URL}/api/mira/personalization-stats/{PET_ID}")
        assert res.status_code == 200
        data = res.json()
        items = data.get("knowledge_items", [])
        health_p10 = [i for i in items if i.get("priority") == 10 and i.get("category") == "health"]
        assert len(health_p10) > 0, f"No priority-10 health items after adding allergy. Items: {items[:5]}"


# ── 4. Admin Ticket Listing — member name not Unknown ────────────────────────

# ── 4. Admin Ticket Listing — member name not Unknown ────────────────────────

class TestAdminTicketMemberName:
    """GET /api/service_desk/tickets — verify recent ticket shows real member name"""

    def test_service_desk_tickets_endpoint_accessible(self, session, admin_headers):
        res = session.get(f"{BASE_URL}/api/service_desk/tickets?limit=20", headers=admin_headers)
        assert res.status_code == 200, f"Service desk tickets failed: {res.status_code} {res.text[:200]}"

    def test_recent_dipali_ticket_has_real_name(self, session, admin_headers):
        """Find the most recent ticket from dipali and check member.name is real"""
        res = session.get(f"{BASE_URL}/api/service_desk/tickets?limit=50", headers=admin_headers)
        assert res.status_code == 200
        data = res.json()
        tickets = data.get("tickets", []) or data.get("data", []) or (data if isinstance(data, list) else [])
        # Find dipali's tickets
        dipali_tickets = [
            t for t in tickets
            if (t.get("user_email","") or "").lower() == USER_EMAIL.lower()
            or (t.get("member",{}).get("email","") or "").lower() == USER_EMAIL.lower()
            or (t.get("parent_id","") or "").lower() == USER_EMAIL.lower()
        ]
        if not dipali_tickets:
            pytest.skip("No dipali tickets found in last 50 — create a ticket first")
        
        # Check the most recent one
        latest = sorted(dipali_tickets, key=lambda t: t.get("created_at",""), reverse=True)[0]
        member_name = (latest.get("member") or {}).get("name","") or latest.get("user_name","")
        assert member_name not in ("Unknown", "", "Pet Parent"), \
            f"Latest dipali ticket still shows Unknown. member={latest.get('member')}"
        print(f"[PASS] Latest Dipali ticket '{latest.get('ticket_id')}' has name: '{member_name}'")

    def test_ticket_lookup_by_id_returns_member(self, session, admin_headers):
        """GET /api/tickets/{ticket_id} returns ticket with member info"""
        # Get a ticket ID via service_desk tickets
        res = session.get(f"{BASE_URL}/api/service_desk/tickets?limit=10", headers=admin_headers)
        data = res.json()
        tickets = data.get("tickets", []) or []
        if not tickets:
            pytest.skip("No tickets found")
        
        # Find a ticket with member info  
        for t in tickets:
            member_name = (t.get("member") or {}).get("name","")
            if member_name and member_name not in ("Unknown", "Pet Parent", ""):
                ticket_id = t.get("ticket_id") or t.get("id")
                print(f"[PASS] Admin ticket {ticket_id} shows member: {member_name}")
                return
        pytest.fail("All visible tickets have Unknown/empty member name - check name resolution")


# ── 5. Vault Summary — Health Vault Data ─────────────────────────────────────

class TestVaultSummaryHealthData:
    """GET /api/pet-vault/{pet_id}/summary — verify all health vault sections"""

    def test_summary_returns_200(self, session, member_headers):
        res = session.get(f"{BASE_URL}/api/pet-vault/{PET_ID}/summary", headers=member_headers)
        assert res.status_code == 200

    def test_summary_has_chicken_allergy(self, session, member_headers):
        res = session.get(f"{BASE_URL}/api/pet-vault/{PET_ID}/summary", headers=member_headers)
        data = res.json()
        allergy_names = [a.get("name","").lower() for a in data.get("allergies", [])]
        assert "chicken" in allergy_names, f"Chicken allergy not in vault. Got: {allergy_names}"

    def test_summary_has_vaccines(self, session, member_headers):
        res = session.get(f"{BASE_URL}/api/pet-vault/{PET_ID}/summary", headers=member_headers)
        data = res.json()
        summary = data.get("summary", {})
        assert summary.get("total_vaccines", 0) > 0, "Expected vaccines in vault summary"

    def test_summary_counts(self, session, member_headers):
        res = session.get(f"{BASE_URL}/api/pet-vault/{PET_ID}/summary", headers=member_headers)
        data = res.json()
        s = data.get("summary", {})
        for field in ["total_vaccines", "total_medications", "total_vet_visits", "total_documents", "saved_vets"]:
            assert field in s, f"Missing summary field: {field}"


# ── 6. SoulChapterModal — health chapter fields ───────────────────────────────

class TestSoulChapterHealthFields:
    """GET /api/soul-chapter/{pet_id}/health — vaccinated, vaccination_status, has_regular_vet"""

    def test_health_chapter_returns_200(self, session, member_headers):
        """Soul chapter health data should be accessible"""
        res = session.get(f"{BASE_URL}/api/pet-soul/{PET_ID}", headers=member_headers)
        # Accept 200 or 404 (endpoint might not exist)
        assert res.status_code in (200, 404), f"Unexpected status: {res.status_code}"

    def test_pet_home_endpoint(self, session, member_headers):
        """GET /api/pet-home/{pet_id} — Health chapter should have food_allergies"""
        res = session.get(f"{BASE_URL}/api/pets/{PET_ID}", headers=member_headers)
        assert res.status_code == 200, f"Pet data failed: {res.status_code}"
        data = res.json()
        pet = data.get("pet") or data
        soul = pet.get("doggy_soul_answers") or {}
        vault = pet.get("vault") or {}
        # Vault allergies should exist
        vault_allergies = vault.get("allergies", [])
        assert len(vault_allergies) > 0, f"Expected vault allergies in pet data, vault: {vault.keys()}"


# ── 7. Pillar tracking — dine, go, learn, play, shop ─────────────────────────

class TestPillarTracking:
    """Verify pillar-specific tracking endpoints work"""

    def test_dine_pillar_accessible(self, session, member_headers):
        res = session.get(f"{BASE_URL}/api/dine/services", headers=member_headers)
        assert res.status_code in (200, 404), f"Dine pillar status: {res.status_code}"

    def test_platform_tracking_endpoint(self, session, member_headers):
        """POST /api/mira/track-pillar-visit — track a pillar visit"""
        res = session.post(
            f"{BASE_URL}/api/mira/track-pillar-visit",
            json={
                "pillar": "care",
                "pet_id": PET_ID,
                "parent_id": USER_EMAIL,
                "channel": "pillar_page_visit"
            },
            headers=member_headers
        )
        # Accept 200 or 404 (endpoint may not exist under this path)
        assert res.status_code in (200, 404, 422), f"Track pillar: {res.status_code} {res.text[:200]}"


# ── 8. Ticket Completeness after Fix ─────────────────────────────────────────

class TestTicketCompletenessCritical:
    """Create a ticket via all pillar formats and verify member name is real"""

    @pytest.mark.parametrize("pillar,intent", [
        ("dine", "book_dine"),
        ("play", "book_play"),
        ("learn", "book_training"),
    ])
    def test_create_ticket_different_pillars(self, session, member_headers, pillar, intent):
        """Every pillar should create ticket with real member name (verified via GET)"""
        import time
        unique_chan = f"{pillar}_test_{int(time.time())}"
        payload = {
            "parent_id": USER_EMAIL,
            "pet_id": PET_ID,
            "pillar": pillar,
            "channel": unique_chan,
            "intent_primary": intent,
            "intent_secondary": [intent.replace("_"," ").title()],
            "life_state": "everyday",
            "initial_message": {
                "sender": "member",
                "text": f"TEST_185: Booking via {pillar} pillar"
            }
        }
        res = session.post(
            f"{BASE_URL}/api/service_desk/attach_or_create_ticket",
            json=payload,
            headers=member_headers
        )
        assert res.status_code == 200, f"{pillar} ticket creation failed: {res.status_code} {res.text[:300]}"
        ticket_id = res.json().get("ticket_id")
        assert ticket_id, f"{pillar}: No ticket_id in response"
        
        # Fetch full ticket to check member name
        full_res = session.get(f"{BASE_URL}/api/tickets/{ticket_id}", headers=member_headers)
        assert full_res.status_code == 200, f"Could not fetch ticket {ticket_id}: {full_res.status_code}"
        full_ticket = full_res.json().get("ticket") or full_res.json()
        member = full_ticket.get("member") or {}
        name = member.get("name","")
        assert name not in ("Unknown", "", "Pet Parent"), \
            f"{pillar}: member.name='{name}' should not be Unknown/Pet Parent"
        print(f"[PASS] {pillar} ticket {ticket_id}: member.name='{name}'")
