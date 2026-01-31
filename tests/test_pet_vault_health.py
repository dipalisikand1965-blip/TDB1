"""
Test Pet Vault Health Records API
Tests for vaccines, medications, vet visits, and weight history endpoints
"""

import pytest
import requests
import os
from datetime import datetime, timedelta

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://responsive-app-10.preview.emergentagent.com')
AUTH_HEADER = "Basic YWRpdHlhOmxvbGE0MzA0"  # aditya:lola4304

# Test pet ID - Mojo
TEST_PET_ID = "pet-99a708f1722a"


class TestPetVaultVaccines:
    """Test vaccine endpoints"""
    
    def test_get_vaccines(self):
        """Test getting vaccine records for a pet"""
        response = requests.get(
            f"{BASE_URL}/api/pet-vault/{TEST_PET_ID}/vaccines",
            headers={"Authorization": AUTH_HEADER}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "pet_id" in data
        assert "pet_name" in data
        assert "vaccines" in data
        assert "total" in data
        
        # Mojo should have 2 vaccines (Rabies and DHPP)
        assert data["total"] >= 2
        assert data["pet_name"] == "Mojo"
        
        # Check vaccine data structure
        if len(data["vaccines"]) > 0:
            vaccine = data["vaccines"][0]
            assert "id" in vaccine
            assert "vaccine_name" in vaccine
            assert "date_given" in vaccine
        
        print(f"✓ Found {data['total']} vaccines for {data['pet_name']}")
    
    def test_get_vaccines_includes_rabies(self):
        """Test that Mojo has Rabies vaccine"""
        response = requests.get(
            f"{BASE_URL}/api/pet-vault/{TEST_PET_ID}/vaccines",
            headers={"Authorization": AUTH_HEADER}
        )
        assert response.status_code == 200
        data = response.json()
        
        vaccine_names = [v["vaccine_name"] for v in data["vaccines"]]
        assert "Rabies" in vaccine_names
        print("✓ Rabies vaccine found")
    
    def test_get_vaccines_includes_dhpp(self):
        """Test that Mojo has DHPP vaccine"""
        response = requests.get(
            f"{BASE_URL}/api/pet-vault/{TEST_PET_ID}/vaccines",
            headers={"Authorization": AUTH_HEADER}
        )
        assert response.status_code == 200
        data = response.json()
        
        vaccine_names = [v["vaccine_name"] for v in data["vaccines"]]
        assert any("DHPP" in name for name in vaccine_names)
        print("✓ DHPP vaccine found")
    
    def test_add_vaccine(self):
        """Test adding a new vaccine record"""
        vaccine_data = {
            "vaccine_name": "TEST_Bordetella",
            "date_given": datetime.now().strftime("%Y-%m-%d"),
            "next_due_date": (datetime.now() + timedelta(days=365)).strftime("%Y-%m-%d"),
            "vet_name": "Dr. Test",
            "notes": "Test vaccine - can be deleted"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/pet-vault/{TEST_PET_ID}/vaccines",
            headers={"Authorization": AUTH_HEADER, "Content-Type": "application/json"},
            json=vaccine_data
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "vaccine" in data
        assert data["vaccine"]["vaccine_name"] == "TEST_Bordetella"
        assert "id" in data["vaccine"]
        
        # Store vaccine ID for cleanup
        vaccine_id = data["vaccine"]["id"]
        print(f"✓ Added vaccine with ID: {vaccine_id}")
        
        # Cleanup - delete the test vaccine
        delete_response = requests.delete(
            f"{BASE_URL}/api/pet-vault/{TEST_PET_ID}/vaccines/{vaccine_id}",
            headers={"Authorization": AUTH_HEADER}
        )
        assert delete_response.status_code == 200
        print("✓ Cleaned up test vaccine")


class TestPetVaultMedications:
    """Test medication endpoints"""
    
    def test_get_medications(self):
        """Test getting medication records for a pet"""
        response = requests.get(
            f"{BASE_URL}/api/pet-vault/{TEST_PET_ID}/medications",
            headers={"Authorization": AUTH_HEADER}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "pet_id" in data
        assert "pet_name" in data
        assert "medications" in data
        assert "total" in data
        
        # Mojo should have at least 1 medication (Nexgard)
        assert data["total"] >= 1
        
        print(f"✓ Found {data['total']} medications for {data['pet_name']}")
    
    def test_get_medications_includes_nexgard(self):
        """Test that Mojo has Nexgard medication"""
        response = requests.get(
            f"{BASE_URL}/api/pet-vault/{TEST_PET_ID}/medications",
            headers={"Authorization": AUTH_HEADER}
        )
        assert response.status_code == 200
        data = response.json()
        
        medication_names = [m["medication_name"] for m in data["medications"]]
        assert "Nexgard" in medication_names
        print("✓ Nexgard medication found")
    
    def test_get_active_medications(self):
        """Test getting only active medications"""
        response = requests.get(
            f"{BASE_URL}/api/pet-vault/{TEST_PET_ID}/medications?active_only=true",
            headers={"Authorization": AUTH_HEADER}
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "medications" in data
        print(f"✓ Found {len(data['medications'])} active medications")
    
    def test_add_medication(self):
        """Test adding a new medication record"""
        medication_data = {
            "medication_name": "TEST_Heartgard",
            "dosage": "50mg",
            "frequency": "once monthly",
            "start_date": datetime.now().strftime("%Y-%m-%d"),
            "reason": "Heartworm prevention",
            "notes": "Test medication - can be deleted"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/pet-vault/{TEST_PET_ID}/medications",
            headers={"Authorization": AUTH_HEADER, "Content-Type": "application/json"},
            json=medication_data
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "medication" in data
        assert data["medication"]["medication_name"] == "TEST_Heartgard"
        assert "id" in data["medication"]
        
        print(f"✓ Added medication with ID: {data['medication']['id']}")


class TestPetVaultVetVisits:
    """Test vet visit endpoints"""
    
    def test_get_vet_visits(self):
        """Test getting vet visit records for a pet"""
        response = requests.get(
            f"{BASE_URL}/api/pet-vault/{TEST_PET_ID}/visits",
            headers={"Authorization": AUTH_HEADER}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "pet_id" in data
        assert "pet_name" in data
        assert "visits" in data
        assert "total" in data
        
        # Mojo should have at least 1 vet visit
        assert data["total"] >= 1
        
        print(f"✓ Found {data['total']} vet visits for {data['pet_name']}")
    
    def test_get_vet_visits_includes_annual_checkup(self):
        """Test that Mojo has annual checkup visit"""
        response = requests.get(
            f"{BASE_URL}/api/pet-vault/{TEST_PET_ID}/visits",
            headers={"Authorization": AUTH_HEADER}
        )
        assert response.status_code == 200
        data = response.json()
        
        visit_reasons = [v["reason"] for v in data["visits"]]
        assert any("checkup" in reason.lower() for reason in visit_reasons)
        print("✓ Annual checkup visit found")


class TestPetVaultWeightHistory:
    """Test weight history endpoints"""
    
    def test_get_weight_history(self):
        """Test getting weight history for a pet"""
        response = requests.get(
            f"{BASE_URL}/api/pet-vault/{TEST_PET_ID}/weight-history",
            headers={"Authorization": AUTH_HEADER}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "pet_id" in data
        assert "pet_name" in data
        assert "weight_history" in data
        assert "total_records" in data
        
        print(f"✓ Found {data['total_records']} weight records for {data['pet_name']}")
    
    def test_add_weight_record(self):
        """Test adding a new weight record"""
        weight_data = {
            "date": datetime.now().strftime("%Y-%m-%d"),
            "weight_kg": 15.5,
            "notes": "Test weight record"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/pet-vault/{TEST_PET_ID}/weight",
            headers={"Authorization": AUTH_HEADER, "Content-Type": "application/json"},
            json=weight_data
        )
        assert response.status_code == 200
        data = response.json()
        
        assert "record" in data
        assert data["record"]["weight_kg"] == 15.5
        
        print("✓ Added weight record")


class TestPetVaultHealthSummary:
    """Test health summary endpoint"""
    
    def test_get_health_summary(self):
        """Test getting complete health summary for a pet"""
        response = requests.get(
            f"{BASE_URL}/api/pet-vault/{TEST_PET_ID}/summary",
            headers={"Authorization": AUTH_HEADER}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "pet_id" in data
        assert "pet_name" in data
        assert "summary" in data
        
        # Check summary fields
        summary = data["summary"]
        assert "total_vaccines" in summary
        assert "total_medications" in summary
        assert "total_vet_visits" in summary
        
        print(f"✓ Health summary: {summary['total_vaccines']} vaccines, {summary['total_medications']} medications, {summary['total_vet_visits']} vet visits")


class TestPetVaultVets:
    """Test vet info endpoints"""
    
    def test_get_vets(self):
        """Test getting saved vet information for a pet"""
        response = requests.get(
            f"{BASE_URL}/api/pet-vault/{TEST_PET_ID}/vets",
            headers={"Authorization": AUTH_HEADER}
        )
        assert response.status_code == 200
        data = response.json()
        
        # Verify response structure
        assert "pet_id" in data
        assert "vets" in data
        assert "total" in data
        
        print(f"✓ Found {data['total']} saved vets")


class TestPetVaultErrorHandling:
    """Test error handling for pet vault endpoints"""
    
    def test_get_vaccines_invalid_pet(self):
        """Test getting vaccines for non-existent pet"""
        response = requests.get(
            f"{BASE_URL}/api/pet-vault/invalid-pet-id/vaccines",
            headers={"Authorization": AUTH_HEADER}
        )
        assert response.status_code == 404
        print("✓ Returns 404 for invalid pet ID")
    
    def test_get_medications_invalid_pet(self):
        """Test getting medications for non-existent pet"""
        response = requests.get(
            f"{BASE_URL}/api/pet-vault/invalid-pet-id/medications",
            headers={"Authorization": AUTH_HEADER}
        )
        assert response.status_code == 404
        print("✓ Returns 404 for invalid pet ID")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
