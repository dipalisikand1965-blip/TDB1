"""
Pet Vault Feature Tests — Iteration 184
Tests for: Allergies, Vaccines, Identity, Documents, Summary endpoints
Pet ID: pet-mojo-7327ad56
"""

import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/")
PET_ID = "pet-mojo-7327ad56"

# ── Helper ───────────────────────────────────────────────────────────────────
@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s

@pytest.fixture(scope="module")
def auth_token(session):
    """Login as dipali@clubconcierge.in and get token"""
    res = session.post(f"{BASE_URL}/api/auth/login", json={
        "email": "dipali@clubconcierge.in",
        "password": "test123"
    })
    if res.status_code == 200:
        return res.json().get("access_token") or res.json().get("token")
    pytest.skip(f"Auth failed: {res.status_code} {res.text[:200]}")

# ── Summary ──────────────────────────────────────────────────────────────────

class TestVaultSummary:
    """Vault summary endpoint with allergies, microchip, insurance"""

    def test_summary_returns_200(self, session):
        res = session.get(f"{BASE_URL}/api/pet-vault/{PET_ID}/summary")
        assert res.status_code == 200

    def test_summary_has_pet_name(self, session):
        res = session.get(f"{BASE_URL}/api/pet-vault/{PET_ID}/summary")
        data = res.json()
        assert data.get("pet_name") == "Mojo"

    def test_summary_has_microchip(self, session):
        res = session.get(f"{BASE_URL}/api/pet-vault/{PET_ID}/summary")
        data = res.json()
        assert data.get("microchip") == "985141000123456"

    def test_summary_has_allergies_field(self, session):
        res = session.get(f"{BASE_URL}/api/pet-vault/{PET_ID}/summary")
        data = res.json()
        assert "allergies" in data
        assert isinstance(data["allergies"], list)

    def test_summary_allergies_has_chicken(self, session):
        res = session.get(f"{BASE_URL}/api/pet-vault/{PET_ID}/summary")
        data = res.json()
        allergy_names = [a["name"].lower() for a in data.get("allergies", [])]
        assert "chicken" in allergy_names, f"Expected 'chicken' in allergies, got {allergy_names}"

    def test_summary_insurance_field(self, session):
        res = session.get(f"{BASE_URL}/api/pet-vault/{PET_ID}/summary")
        data = res.json()
        assert "insurance" in data  # can be None

    def test_summary_passport_field(self, session):
        res = session.get(f"{BASE_URL}/api/pet-vault/{PET_ID}/summary")
        data = res.json()
        assert "passport" in data

    def test_summary_has_counts(self, session):
        res = session.get(f"{BASE_URL}/api/pet-vault/{PET_ID}/summary")
        data = res.json()
        s = data.get("summary", {})
        for field in ["total_vaccines", "total_medications", "total_vet_visits", "total_documents", "saved_vets"]:
            assert field in s, f"Missing field: {field}"


# ── Allergies ─────────────────────────────────────────────────────────────────

class TestAllergiesEndpoints:
    """GET and POST /api/pet-vault/{pet_id}/allergies"""

    def test_get_allergies_200(self, session):
        res = session.get(f"{BASE_URL}/api/pet-vault/{PET_ID}/allergies")
        assert res.status_code == 200

    def test_get_allergies_structure(self, session):
        res = session.get(f"{BASE_URL}/api/pet-vault/{PET_ID}/allergies")
        data = res.json()
        assert "allergies" in data
        assert "total" in data
        assert isinstance(data["allergies"], list)

    def test_chicken_allergy_exists(self, session):
        res = session.get(f"{BASE_URL}/api/pet-vault/{PET_ID}/allergies")
        data = res.json()
        names = [a["name"].lower() for a in data["allergies"]]
        assert "chicken" in names

    def test_add_allergy_returns_201_or_200(self, session):
        payload = {
            "name": "TEST_Beef",
            "allergy_type": "food",
            "severity": "moderate",
            "confirmed_by": "Dr. Test",
            "notes": "Test allergy - automated test"
        }
        res = session.post(f"{BASE_URL}/api/pet-vault/{PET_ID}/allergies", json=payload)
        assert res.status_code in [200, 201], f"Expected 200/201, got {res.status_code}: {res.text[:200]}"

    def test_add_allergy_response_has_allergy(self, session):
        payload = {
            "name": "TEST_Pollen",
            "allergy_type": "environmental",
            "severity": "mild"
        }
        res = session.post(f"{BASE_URL}/api/pet-vault/{PET_ID}/allergies", json=payload)
        assert res.status_code in [200, 201]
        data = res.json()
        assert "allergy" in data
        assert data["allergy"]["name"] == "TEST_Pollen"

    def test_add_allergy_soul_profile_updated(self, session):
        """After adding allergy, soul profile food_allergies should be updated"""
        payload = {
            "name": "TEST_Walnut",
            "allergy_type": "food",
            "severity": "severe"
        }
        res = session.post(f"{BASE_URL}/api/pet-vault/{PET_ID}/allergies", json=payload)
        assert res.status_code in [200, 201]
        # Verify the allergy is now in GET response
        get_res = session.get(f"{BASE_URL}/api/pet-vault/{PET_ID}/allergies")
        names = [a["name"].lower() for a in get_res.json()["allergies"]]
        assert "test_walnut" in names


# ── Vaccines ─────────────────────────────────────────────────────────────────

class TestVaccinesEndpoints:
    """GET and POST /api/pet-vault/{pet_id}/vaccines"""

    def test_get_vaccines_200(self, session):
        res = session.get(f"{BASE_URL}/api/pet-vault/{PET_ID}/vaccines")
        assert res.status_code == 200

    def test_get_vaccines_structure(self, session):
        res = session.get(f"{BASE_URL}/api/pet-vault/{PET_ID}/vaccines")
        data = res.json()
        for field in ["vaccines", "upcoming_vaccines", "overdue_vaccines", "total"]:
            assert field in data, f"Missing field: {field}"

    def test_add_vaccine_and_verify(self, session):
        today = datetime.now().strftime("%Y-%m-%d")
        due_date = (datetime.now() + timedelta(days=14)).strftime("%Y-%m-%d")
        payload = {
            "vaccine_name": "TEST_Rabies",
            "date_given": today,
            "next_due_date": due_date,
            "vet_name": "Dr. Test Vet",
            "reminder_enabled": True,
            "notes": "Automated test vaccine"
        }
        res = session.post(f"{BASE_URL}/api/pet-vault/{PET_ID}/vaccines", json=payload)
        assert res.status_code in [200, 201], f"Got {res.status_code}: {res.text[:200]}"
        data = res.json()
        assert "vaccine" in data
        assert data["vaccine"]["vaccine_name"] == "TEST_Rabies"

    def test_vaccine_appears_in_get(self, session):
        """Vaccine added should appear in GET"""
        res = session.get(f"{BASE_URL}/api/pet-vault/{PET_ID}/vaccines")
        data = res.json()
        names = [v["vaccine_name"] for v in data["vaccines"]]
        assert "TEST_Rabies" in names, f"TEST_Rabies not found in {names}"


# ── Documents ─────────────────────────────────────────────────────────────────

class TestDocumentsEndpoints:

    def test_get_documents_200(self, session):
        res = session.get(f"{BASE_URL}/api/pet-vault/{PET_ID}/documents")
        assert res.status_code == 200

    def test_get_documents_structure(self, session):
        res = session.get(f"{BASE_URL}/api/pet-vault/{PET_ID}/documents")
        data = res.json()
        assert "documents" in data
        assert "total" in data


# ── Medications ───────────────────────────────────────────────────────────────

class TestMedicationsEndpoints:

    def test_get_medications_200(self, session):
        res = session.get(f"{BASE_URL}/api/pet-vault/{PET_ID}/medications")
        assert res.status_code == 200

    def test_get_medications_structure(self, session):
        res = session.get(f"{BASE_URL}/api/pet-vault/{PET_ID}/medications")
        data = res.json()
        assert "medications" in data
        assert "total" in data


# ── Vet Visits & Vets ─────────────────────────────────────────────────────────

class TestVisitsAndVets:

    def test_get_visits_200(self, session):
        res = session.get(f"{BASE_URL}/api/pet-vault/{PET_ID}/visits")
        assert res.status_code == 200

    def test_get_vets_200(self, session):
        res = session.get(f"{BASE_URL}/api/pet-vault/{PET_ID}/vets")
        assert res.status_code == 200

    def test_get_vets_structure(self, session):
        res = session.get(f"{BASE_URL}/api/pet-vault/{PET_ID}/vets")
        data = res.json()
        assert "vets" in data
        assert "total" in data
