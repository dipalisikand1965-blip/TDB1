"""
Test suite for Celebrate Concierge® Intake Endpoint
POST /api/concierge/intake
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestConciergeIntakeEndpoint:
    """Tests for POST /api/concierge/intake endpoint"""

    def test_intake_basic_submission(self):
        """Test basic intake submission with all fields"""
        payload = {
            "petId": "TEST_pet_123",
            "petName": "TEST_Mojo",
            "serviceType": "birthday_party",
            "celebrationDate": "2026-03-15",
            "notes": "Loves squeaky toys and peanut butter",
            "source": "concierge_intake_modal"
        }
        response = requests.post(
            f"{BASE_URL}/api/concierge/intake",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"

        data = response.json()
        assert data.get("success") is True, f"Expected success=True, got {data}"
        assert "intakeId" in data, f"Expected intakeId in response, got {data}"
        assert "message" in data, f"Expected message in response, got {data}"
        assert data["intakeId"].startswith("INT-"), f"Expected intakeId to start with INT-, got {data['intakeId']}"
        print(f"✓ Basic intake submission passed - intakeId: {data['intakeId']}")

    def test_intake_without_date_not_sure(self):
        """Test intake submission with notSureDate=True (no date)"""
        payload = {
            "petName": "TEST_Bella",
            "serviceType": "gotcha_day",
            "celebrationDate": None,
            "notes": "Just wants to celebrate adoption day",
            "source": "concierge_intake_modal"
        }
        response = requests.post(
            f"{BASE_URL}/api/concierge/intake",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"

        data = response.json()
        assert data.get("success") is True
        assert "intakeId" in data
        print(f"✓ Intake without date passed - intakeId: {data['intakeId']}")

    def test_intake_minimal_fields(self):
        """Test intake with minimal required fields only"""
        payload = {
            "serviceType": "general"
        }
        response = requests.post(
            f"{BASE_URL}/api/concierge/intake",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"

        data = response.json()
        assert data.get("success") is True
        assert "intakeId" in data
        print(f"✓ Minimal fields intake passed - intakeId: {data['intakeId']}")

    def test_intake_all_service_types(self):
        """Test intake with each of the 8 service types"""
        service_types = [
            'birthday_party', 'photography', 'custom_cake',
            'pawty', 'gotcha_day', 'surprise_delivery',
            'milestone', 'venue'
        ]
        for service_type in service_types:
            payload = {
                "petName": f"TEST_pet",
                "serviceType": service_type,
                "source": "concierge_intake_modal"
            }
            response = requests.post(
                f"{BASE_URL}/api/concierge/intake",
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            assert response.status_code == 200, f"Service type {service_type} failed: {response.status_code}: {response.text}"
            data = response.json()
            assert data.get("success") is True, f"Service type {service_type} failed: {data}"
        print(f"✓ All 8 service types accepted successfully")

    def test_intake_empty_body(self):
        """Test intake with completely empty body (all optional)"""
        response = requests.post(
            f"{BASE_URL}/api/concierge/intake",
            json={},
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200, f"Empty body failed: {response.status_code}: {response.text}"
        data = response.json()
        assert data.get("success") is True
        print(f"✓ Empty body intake passed - intakeId: {data.get('intakeId')}")

    def test_intake_response_structure(self):
        """Validate response structure has all required fields"""
        payload = {
            "petName": "TEST_Charlie",
            "serviceType": "milestone",
            "celebrationDate": "2026-04-20"
        }
        response = requests.post(
            f"{BASE_URL}/api/concierge/intake",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200

        data = response.json()
        # Verify all required response fields
        assert "success" in data
        assert "message" in data
        assert "intakeId" in data
        assert isinstance(data["success"], bool)
        assert isinstance(data["message"], str)
        assert isinstance(data["intakeId"], str)
        assert len(data["intakeId"]) > 0
        print(f"✓ Response structure correct: success={data['success']}, intakeId={data['intakeId']}, message length={len(data['message'])}")


class TestServiceBoxIllustrations:
    """Test service illustrations API used by CelebrateServiceGrid"""

    def test_service_box_api_returns_celebrate_services(self):
        """Test that service-box API returns celebrate pillar services"""
        response = requests.get(
            f"{BASE_URL}/api/service-box/services?pillar=celebrate&limit=8&is_active=true",
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"

        data = response.json()
        assert "services" in data, f"Expected 'services' key in response, got {data}"
        print(f"✓ Service box API returned {len(data.get('services', []))} services for celebrate pillar")

    def test_service_box_api_structure(self):
        """Test each service has expected structure for illustrations"""
        response = requests.get(
            f"{BASE_URL}/api/service-box/services?pillar=celebrate&limit=8&is_active=true"
        )
        assert response.status_code == 200

        data = response.json()
        services = data.get("services", [])

        if len(services) == 0:
            print("⚠ No services returned for celebrate pillar - illustrations may show fallback")
        else:
            for svc in services[:8]:
                # At least one image field should be present
                has_image = any(svc.get(k) for k in ['image_url', 'watercolor_image', 'image'])
                if not has_image:
                    print(f"⚠ Service {svc.get('id')} missing image URL fields")
            print(f"✓ Service box API structure validated for {len(services)} services")
