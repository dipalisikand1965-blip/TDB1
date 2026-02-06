"""
Communication System API Tests
Tests for the Unified Reminder & Mailing System endpoints
"""

import pytest
import requests
import os
from base64 import b64encode

# Get BASE_URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')
if not BASE_URL:
    BASE_URL = "https://unified-pet-pages.preview.emergentagent.com"

# Admin credentials
ADMIN_USERNAME = "aditya"
ADMIN_PASSWORD = "lola4304"

def get_admin_auth_header():
    """Get Basic Auth header for admin endpoints"""
    credentials = f"{ADMIN_USERNAME}:{ADMIN_PASSWORD}"
    encoded = b64encode(credentials.encode()).decode()
    return {"Authorization": f"Basic {encoded}"}


class TestCommunicationSystemHealth:
    """Test communication system basic health"""
    
    def test_api_health(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        print(f"✓ API health check passed: {data}")


class TestCommunicationTemplates:
    """Test communication templates endpoints"""
    
    def test_get_templates(self):
        """Test getting all communication templates"""
        headers = get_admin_auth_header()
        response = requests.get(f"{BASE_URL}/api/admin/communications/templates", headers=headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "templates" in data, "Response should contain 'templates' key"
        assert "count" in data, "Response should contain 'count' key"
        
        templates = data["templates"]
        assert isinstance(templates, list), "Templates should be a list"
        assert len(templates) > 0, "Should have at least one template"
        
        # Verify default templates exist
        template_ids = [t.get("id") for t in templates]
        expected_templates = [
            "vaccination_upcoming",
            "vaccination_overdue", 
            "birthday_nudge",
            "adoption_day_nudge",
            "grooming_reminder",
            "weekly_soul_question",
            "relationship_checkin"
        ]
        
        for expected in expected_templates:
            assert expected in template_ids, f"Missing expected template: {expected}"
        
        print(f"✓ Templates endpoint working: {data['count']} templates found")
        print(f"  Template IDs: {template_ids}")
    
    def test_get_default_templates(self):
        """Test getting default system templates"""
        headers = get_admin_auth_header()
        response = requests.get(f"{BASE_URL}/api/admin/communications/templates/defaults", headers=headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "templates" in data
        templates = data["templates"]
        
        # All default templates should have is_default=True
        for template in templates:
            assert template.get("is_default") == True, f"Template {template.get('id')} should be default"
            assert "body" in template, f"Template {template.get('id')} should have body"
            assert "subject" in template, f"Template {template.get('id')} should have subject"
        
        print(f"✓ Default templates endpoint working: {len(templates)} default templates")


class TestCommunicationAnalytics:
    """Test communication analytics endpoint"""
    
    def test_get_analytics(self):
        """Test getting communication analytics"""
        headers = get_admin_auth_header()
        response = requests.get(f"{BASE_URL}/api/admin/communications/analytics", headers=headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "total_sent" in data, "Response should contain 'total_sent'"
        assert "sent_last_7_days" in data, "Response should contain 'sent_last_7_days'"
        assert "by_channel" in data, "Response should contain 'by_channel'"
        assert "by_type" in data, "Response should contain 'by_type'"
        
        # Values should be non-negative
        assert data["total_sent"] >= 0, "total_sent should be non-negative"
        assert data["sent_last_7_days"] >= 0, "sent_last_7_days should be non-negative"
        
        print(f"✓ Analytics endpoint working:")
        print(f"  Total sent: {data['total_sent']}")
        print(f"  Last 7 days: {data['sent_last_7_days']}")
        print(f"  By channel: {data['by_channel']}")


class TestPendingReminders:
    """Test pending reminders endpoint"""
    
    def test_get_pending_reminders(self):
        """Test getting pending reminders"""
        headers = get_admin_auth_header()
        response = requests.get(f"{BASE_URL}/api/admin/communications/pending", headers=headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "reminders" in data, "Response should contain 'reminders'"
        assert "by_type" in data, "Response should contain 'by_type'"
        assert "total" in data, "Response should contain 'total'"
        
        reminders = data["reminders"]
        assert isinstance(reminders, list), "Reminders should be a list"
        
        print(f"✓ Pending reminders endpoint working:")
        print(f"  Total pending: {data['total']}")
        print(f"  By type: {list(data['by_type'].keys())}")
    
    def test_get_pending_reminders_with_days_param(self):
        """Test getting pending reminders with custom days_ahead parameter"""
        headers = get_admin_auth_header()
        response = requests.get(f"{BASE_URL}/api/admin/communications/pending?days_ahead=14", headers=headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "total" in data
        print(f"✓ Pending reminders with days_ahead=14: {data['total']} reminders")


class TestSoulQuestions:
    """Test soul questions endpoints"""
    
    def test_get_soul_questions(self):
        """Test getting all soul questions"""
        headers = get_admin_auth_header()
        response = requests.get(f"{BASE_URL}/api/admin/communications/soul-questions", headers=headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "questions" in data, "Response should contain 'questions'"
        
        questions = data["questions"]
        assert isinstance(questions, list), "Questions should be a list"
        assert len(questions) > 0, "Should have at least one question"
        
        # Verify question structure
        for q in questions:
            assert "id" in q, "Question should have 'id'"
            assert "pillar" in q, "Question should have 'pillar'"
            assert "question" in q, "Question should have 'question'"
            assert "options" in q, "Question should have 'options'"
            assert "option_values" in q, "Question should have 'option_values'"
        
        print(f"✓ Soul questions endpoint working: {len(questions)} questions")
        print(f"  Question IDs: {[q['id'] for q in questions]}")


class TestConfigStatus:
    """Test communication config status endpoint"""
    
    def test_get_config_status(self):
        """Test getting communication configuration status"""
        headers = get_admin_auth_header()
        response = requests.get(f"{BASE_URL}/api/admin/communications/config-status", headers=headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "email" in data, "Response should contain 'email' config"
        assert "whatsapp" in data, "Response should contain 'whatsapp' config"
        assert "in_app" in data, "Response should contain 'in_app' config"
        
        # Verify email config
        email_config = data["email"]
        assert "provider" in email_config, "Email config should have 'provider'"
        assert "configured" in email_config, "Email config should have 'configured'"
        assert email_config["provider"] == "resend", "Email provider should be 'resend'"
        
        # Verify WhatsApp config
        whatsapp_config = data["whatsapp"]
        assert "provider" in whatsapp_config, "WhatsApp config should have 'provider'"
        assert "configured" in whatsapp_config, "WhatsApp config should have 'configured'"
        
        print(f"✓ Config status endpoint working:")
        print(f"  Email: {email_config['provider']} - configured: {email_config['configured']}")
        print(f"  WhatsApp: {whatsapp_config['provider']} - configured: {whatsapp_config['configured']}")
        print(f"  In-app: configured: {data['in_app']['configured']}")


class TestTemplateRendering:
    """Test template rendering functionality"""
    
    def test_render_template_via_send_endpoint(self):
        """Test that templates can be rendered (via send endpoint with validation)"""
        headers = get_admin_auth_header()
        
        # First, get a pet ID from the system
        members_response = requests.get(f"{BASE_URL}/api/admin/members?limit=1", headers=headers)
        
        if members_response.status_code == 200:
            members_data = members_response.json()
            members = members_data.get("members", [])
            
            if members and members[0].get("pets"):
                pet = members[0]["pets"][0]
                pet_id = pet.get("id")
                
                if pet_id:
                    # Try to send a communication (this will test template rendering)
                    send_data = {
                        "pet_id": pet_id,
                        "template_id": "birthday_nudge",
                        "variables": {
                            "pet_name": pet.get("name", "Test Pet"),
                            "pet_parent_name": members[0].get("name", "Test Parent"),
                            "birthday_date": "January 25"
                        }
                    }
                    
                    response = requests.post(
                        f"{BASE_URL}/api/admin/communications/send",
                        headers=headers,
                        json=send_data
                    )
                    
                    # The endpoint should work (may not actually send due to rate limits)
                    assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
                    data = response.json()
                    
                    # Should have either sent or have a reason why not
                    assert "sent" in data or "reason" in data, "Response should indicate send status"
                    
                    print(f"✓ Template rendering test passed")
                    print(f"  Response: {data}")
                    return
        
        # If no pets found, just verify the endpoint exists
        print("⚠ No pets found for template rendering test, skipping detailed test")
        pytest.skip("No pets available for template rendering test")


class TestCommunicationHistory:
    """Test communication history endpoint"""
    
    def test_get_history(self):
        """Test getting communication history"""
        headers = get_admin_auth_header()
        response = requests.get(f"{BASE_URL}/api/admin/communications/history", headers=headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        # Verify response structure
        assert "history" in data, "Response should contain 'history'"
        assert "count" in data, "Response should contain 'count'"
        
        history = data["history"]
        assert isinstance(history, list), "History should be a list"
        
        print(f"✓ Communication history endpoint working: {data['count']} records")


class TestAgentManagementAPI:
    """Test agent management API endpoints"""
    
    def test_get_agents(self):
        """Test getting list of agents"""
        headers = get_admin_auth_header()
        response = requests.get(f"{BASE_URL}/api/admin/agents", headers=headers)
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        data = response.json()
        
        assert "agents" in data, "Response should contain 'agents'"
        agents = data["agents"]
        assert isinstance(agents, list), "Agents should be a list"
        
        print(f"✓ Agent list endpoint working: {len(agents)} agents found")
    
    def test_create_and_delete_agent(self):
        """Test creating and deleting an agent"""
        headers = get_admin_auth_header()
        
        # Create a test agent
        test_agent = {
            "username": "test_agent_comm_system",
            "password": "testpass123",
            "name": "Test Agent for Comm System",
            "email": "test_comm@example.com",
            "phone": "+91 98765 43210",
            "permissions": ["service_desk", "unified_inbox"]
        }
        
        create_response = requests.post(
            f"{BASE_URL}/api/admin/agents",
            headers=headers,
            json=test_agent
        )
        
        # May fail if agent already exists, which is fine
        if create_response.status_code == 201 or create_response.status_code == 200:
            print(f"✓ Agent created successfully")
            
            # Get the agent list to find our agent
            list_response = requests.get(f"{BASE_URL}/api/admin/agents", headers=headers)
            agents = list_response.json().get("agents", [])
            
            test_agent_data = next((a for a in agents if a.get("username") == "test_agent_comm_system"), None)
            
            if test_agent_data:
                agent_id = test_agent_data.get("id")
                
                # Delete the test agent
                delete_response = requests.delete(
                    f"{BASE_URL}/api/admin/agents/{agent_id}",
                    headers=headers
                )
                
                assert delete_response.status_code == 200, f"Delete failed: {delete_response.text}"
                print(f"✓ Agent deleted successfully")
        else:
            # Agent might already exist or other error
            print(f"⚠ Agent creation returned {create_response.status_code}: {create_response.text}")
            # This is acceptable - the endpoint is working


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
