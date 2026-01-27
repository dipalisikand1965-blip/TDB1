"""
Iteration 96: Service Desk Features Testing
- Templates loading in Settings modal
- CSV Export button functionality
- Custom Status addition via POST /api/tickets/statuses
- Custom Category addition via POST /api/tickets/categories
- Dining Concierge Picker on /dine page with 6 service types
- Dining Concierge ticket creation flow
- Smart Auto-Assignment settings endpoint GET /api/tickets/settings/auto-assignment
- SLA alerts settings endpoint GET /api/tickets/settings/sla-alerts
- SLA at-risk tickets endpoint GET /api/tickets/sla-at-risk
- WhatsApp integration status endpoint GET /api/whatsapp/status
"""

import pytest
import requests
import os
import uuid

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

class TestServiceDeskTemplates:
    """Test Service Desk Templates API"""
    
    def test_get_templates(self):
        """GET /api/tickets/templates returns list of templates"""
        response = requests.get(f"{BASE_URL}/api/tickets/templates")
        assert response.status_code == 200
        
        data = response.json()
        assert "templates" in data
        templates = data["templates"]
        assert len(templates) >= 1
        
        # Check template structure
        template = templates[0]
        assert "id" in template
        assert "name" in template
        assert "type" in template
        assert "content" in template
        print(f"✅ Found {len(templates)} templates")
    
    def test_templates_have_required_fields(self):
        """Templates have all required fields"""
        response = requests.get(f"{BASE_URL}/api/tickets/templates")
        assert response.status_code == 200
        
        templates = response.json().get("templates", [])
        for template in templates:
            assert "id" in template, "Template missing id"
            assert "name" in template, "Template missing name"
            assert "type" in template, "Template missing type"
            assert template["type"] in ["email", "sms", "whatsapp"], f"Invalid template type: {template['type']}"
        print(f"✅ All {len(templates)} templates have required fields")


class TestCustomStatusesAndCategories:
    """Test Custom Status and Category management"""
    
    def test_get_statuses(self):
        """GET /api/tickets/statuses returns list of statuses"""
        response = requests.get(f"{BASE_URL}/api/tickets/statuses")
        assert response.status_code == 200
        
        data = response.json()
        assert "statuses" in data
        statuses = data["statuses"]
        assert len(statuses) >= 1
        
        # Check for default statuses
        status_ids = [s["id"] for s in statuses]
        assert "new" in status_ids or "open" in status_ids
        print(f"✅ Found {len(statuses)} statuses")
    
    def test_add_custom_status(self):
        """POST /api/tickets/statuses adds a custom status"""
        unique_id = f"test_status_{uuid.uuid4().hex[:8]}"
        payload = {
            "id": unique_id,
            "label": f"TEST Status {unique_id}",
            "color": "#FF5733"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/tickets/statuses",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("success") == True
        assert data.get("status_id") == unique_id
        print(f"✅ Created custom status: {unique_id}")
    
    def test_get_categories(self):
        """GET /api/tickets/categories returns list of categories"""
        response = requests.get(f"{BASE_URL}/api/tickets/categories")
        assert response.status_code == 200
        
        data = response.json()
        assert "categories" in data
        categories = data["categories"]
        assert len(categories) >= 1
        
        # Check for default categories
        category_ids = [c["id"] for c in categories]
        assert "dine" in category_ids or "care" in category_ids
        print(f"✅ Found {len(categories)} categories")
    
    def test_add_custom_category(self):
        """POST /api/tickets/categories adds a custom category"""
        unique_id = f"test_cat_{uuid.uuid4().hex[:8]}"
        payload = {
            "id": unique_id,
            "name": f"TEST Category {unique_id}",
            "icon": "🧪"
        }
        
        response = requests.post(
            f"{BASE_URL}/api/tickets/categories",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("success") == True
        assert data.get("category_id") == unique_id
        print(f"✅ Created custom category: {unique_id}")


class TestSmartAutoAssignment:
    """Test Smart Auto-Assignment settings"""
    
    def test_get_auto_assignment_settings(self):
        """GET /api/tickets/settings/auto-assignment returns settings"""
        response = requests.get(f"{BASE_URL}/api/tickets/settings/auto-assignment")
        assert response.status_code == 200
        
        data = response.json()
        assert "enabled" in data
        assert "expertise_map" in data
        assert "all_agents" in data
        
        # Check expertise_map has pillar keys
        expertise_map = data["expertise_map"]
        expected_pillars = ["celebrate", "dine", "stay", "travel", "care"]
        for pillar in expected_pillars:
            assert pillar in expertise_map, f"Missing pillar: {pillar}"
        
        print(f"✅ Auto-assignment settings retrieved, enabled={data['enabled']}")
    
    def test_update_auto_assignment_settings(self):
        """POST /api/tickets/settings/auto-assignment updates settings"""
        payload = {
            "enabled": True,
            "expertise_map": {
                "dine": ["Aditya"],
                "care": ["Dipali"],
                "celebrate": ["Aditya", "Dipali"]
            },
            "all_agents": ["Aditya", "Dipali"]
        }
        
        response = requests.post(
            f"{BASE_URL}/api/tickets/settings/auto-assignment",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("success") == True
        print("✅ Auto-assignment settings updated")


class TestSLAAlerts:
    """Test SLA Alerts settings and at-risk tickets"""
    
    def test_get_sla_alert_settings(self):
        """GET /api/tickets/settings/sla-alerts returns settings"""
        response = requests.get(f"{BASE_URL}/api/tickets/settings/sla-alerts")
        assert response.status_code == 200
        
        data = response.json()
        assert "enabled" in data
        assert "warning_threshold_minutes" in data
        assert "breach_escalation" in data
        assert "notification_channels" in data
        
        print(f"✅ SLA alert settings: enabled={data['enabled']}, threshold={data['warning_threshold_minutes']}min")
    
    def test_get_sla_at_risk_tickets(self):
        """GET /api/tickets/sla-at-risk returns at-risk tickets"""
        response = requests.get(f"{BASE_URL}/api/tickets/sla-at-risk")
        assert response.status_code == 200
        
        data = response.json()
        assert "at_risk_count" in data
        assert "tickets" in data
        
        # If there are at-risk tickets, check structure
        if data["at_risk_count"] > 0:
            ticket = data["tickets"][0]
            assert "ticket_id" in ticket
            assert "minutes_remaining" in ticket or "is_breached" in ticket
        
        print(f"✅ SLA at-risk tickets: {data['at_risk_count']} tickets at risk")
    
    def test_update_sla_alert_settings(self):
        """POST /api/tickets/settings/sla-alerts updates settings"""
        payload = {
            "enabled": True,
            "warning_threshold_minutes": 60,
            "breach_escalation": True,
            "notification_channels": ["email", "browser"]
        }
        
        response = requests.post(
            f"{BASE_URL}/api/tickets/settings/sla-alerts",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("success") == True
        print("✅ SLA alert settings updated")


class TestWhatsAppIntegration:
    """Test WhatsApp integration status (MOCKED - no actual WhatsApp provider)"""
    
    def test_get_whatsapp_status(self):
        """GET /api/whatsapp/status returns integration status"""
        response = requests.get(f"{BASE_URL}/api/whatsapp/status")
        assert response.status_code == 200
        
        data = response.json()
        assert "configured" in data
        assert "setup_required" in data
        
        # WhatsApp is not configured (MOCKED)
        if not data["configured"]:
            assert "setup_instructions" in data
            print("✅ WhatsApp status: Not configured (MOCKED - setup instructions provided)")
        else:
            print("✅ WhatsApp status: Configured")


class TestDiningConciergeTicketCreation:
    """Test Dining Concierge ticket creation flow"""
    
    def test_create_dining_ticket(self):
        """POST /api/tickets creates a dining concierge ticket"""
        payload = {
            "member": {
                "name": "TEST Dining User",
                "email": f"test_dining_{uuid.uuid4().hex[:8]}@example.com",
                "phone": "9999999999"
            },
            "category": "dine",
            "sub_category": "restaurant_booking",
            "urgency": "medium",
            "description": "TEST: Restaurant reservation request for pet-friendly dining",
            "source": "web",
            "pet_info": {
                "name": "Buddy",
                "breed": "Golden Retriever"
            }
        }
        
        response = requests.post(
            f"{BASE_URL}/api/tickets/",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        assert response.status_code in [200, 201]
        
        data = response.json()
        assert data.get("success") == True
        assert "ticket" in data
        ticket = data["ticket"]
        ticket_id = ticket.get("ticket_id")
        assert ticket_id is not None
        print(f"✅ Created dining ticket: {ticket_id}")
        
        # Verify ticket was created
        get_response = requests.get(f"{BASE_URL}/api/tickets/{ticket_id}")
        assert get_response.status_code == 200
        ticket_data = get_response.json()
        assert ticket_data.get("ticket", {}).get("category") == "dine" or ticket_data.get("category") == "dine"
        print(f"✅ Verified dining ticket exists with category=dine")


class TestTicketsListAndExport:
    """Test tickets list and export functionality"""
    
    def test_get_tickets_list(self):
        """GET /api/tickets returns list of tickets"""
        response = requests.get(f"{BASE_URL}/api/tickets/")
        assert response.status_code == 200
        
        data = response.json()
        assert "tickets" in data
        tickets = data["tickets"]
        
        if len(tickets) > 0:
            ticket = tickets[0]
            assert "ticket_id" in ticket
            assert "status" in ticket
        
        print(f"✅ Found {len(tickets)} tickets")
    
    def test_tickets_have_export_fields(self):
        """Tickets have fields needed for CSV export"""
        response = requests.get(f"{BASE_URL}/api/tickets/")
        assert response.status_code == 200
        
        tickets = response.json().get("tickets", [])
        if len(tickets) > 0:
            ticket = tickets[0]
            # Check for export-relevant fields
            export_fields = ["ticket_id", "status", "category", "created_at"]
            for field in export_fields:
                assert field in ticket, f"Missing export field: {field}"
        
        print("✅ Tickets have required export fields")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
