"""
Test Source Download and Agent Portal APIs
Tests for iteration 201:
- Source Code Download endpoints (admin-only)
- Agent Portal login and permissions
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Admin credentials
ADMIN_USERNAME = "aditya"
ADMIN_PASSWORD = "lola4304"

# Test agent credentials (created during test)
TEST_AGENT_USERNAME = "testadmin"
TEST_AGENT_PASSWORD = "test123"


class TestSourceDownloadEndpoints:
    """Test source code download endpoints - Admin only"""
    
    def test_source_info_with_auth(self):
        """GET /api/admin/source-info should return file statistics with admin auth"""
        response = requests.get(
            f"{BASE_URL}/api/admin/source-info",
            auth=(ADMIN_USERNAME, ADMIN_PASSWORD)
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # Verify response structure
        assert "file_count" in data, "Missing file_count in response"
        assert "directory_count" in data, "Missing directory_count in response"
        assert "total_size_mb" in data, "Missing total_size_mb in response"
        assert "file_types" in data, "Missing file_types in response"
        assert "excludes" in data, "Missing excludes in response"
        
        # Verify data types
        assert isinstance(data["file_count"], int), "file_count should be int"
        assert isinstance(data["directory_count"], int), "directory_count should be int"
        assert isinstance(data["total_size_mb"], (int, float)), "total_size_mb should be numeric"
        assert isinstance(data["file_types"], dict), "file_types should be dict"
        
        # Verify reasonable values
        assert data["file_count"] > 0, "Should have at least some files"
        assert data["total_size_mb"] > 0, "Total size should be > 0"
        
        print(f"✅ Source info: {data['file_count']} files, {data['total_size_mb']} MB")
    
    def test_source_info_without_auth(self):
        """GET /api/admin/source-info should fail without auth"""
        response = requests.get(f"{BASE_URL}/api/admin/source-info")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✅ Source info correctly requires authentication")
    
    def test_source_info_wrong_credentials(self):
        """GET /api/admin/source-info should fail with wrong credentials"""
        response = requests.get(
            f"{BASE_URL}/api/admin/source-info",
            auth=("wrong", "credentials")
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✅ Source info correctly rejects wrong credentials")
    
    def test_download_source_with_auth(self):
        """GET /api/admin/download-source should return ZIP file with admin auth"""
        response = requests.get(
            f"{BASE_URL}/api/admin/download-source",
            auth=(ADMIN_USERNAME, ADMIN_PASSWORD),
            stream=True  # Don't download full file
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        # Verify headers
        content_type = response.headers.get("content-type", "")
        assert "application/zip" in content_type, f"Expected application/zip, got {content_type}"
        
        content_disposition = response.headers.get("content-disposition", "")
        assert "attachment" in content_disposition, "Should have attachment disposition"
        assert "thedoggycompany_source_" in content_disposition, "Filename should contain thedoggycompany_source_"
        assert ".zip" in content_disposition, "Filename should end with .zip"
        
        content_length = response.headers.get("content-length", "0")
        assert int(content_length) > 0, "Content-Length should be > 0"
        
        print(f"✅ Download source: {int(content_length) / 1024 / 1024:.2f} MB ZIP file")
    
    def test_download_source_without_auth(self):
        """GET /api/admin/download-source should fail without auth"""
        response = requests.get(f"{BASE_URL}/api/admin/download-source")
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✅ Download source correctly requires authentication")


class TestAgentPortalLogin:
    """Test Agent Portal login and verification"""
    
    def test_agent_login_success(self):
        """POST /api/agent/login should succeed with valid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/agent/login",
            json={"username": TEST_AGENT_USERNAME, "password": TEST_AGENT_PASSWORD}
        )
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, "Login should return success=True"
        assert "agent" in data, "Response should contain agent info"
        
        agent = data["agent"]
        assert agent["username"] == TEST_AGENT_USERNAME, "Username should match"
        assert "permissions" in agent, "Agent should have permissions"
        assert isinstance(agent["permissions"], list), "Permissions should be a list"
        
        print(f"✅ Agent login successful: {agent['name']} with permissions: {agent['permissions']}")
        return agent
    
    def test_agent_login_invalid_credentials(self):
        """POST /api/agent/login should fail with invalid credentials"""
        response = requests.post(
            f"{BASE_URL}/api/agent/login",
            json={"username": "nonexistent", "password": "wrongpass"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✅ Agent login correctly rejects invalid credentials")
    
    def test_agent_login_wrong_password(self):
        """POST /api/agent/login should fail with wrong password"""
        response = requests.post(
            f"{BASE_URL}/api/agent/login",
            json={"username": TEST_AGENT_USERNAME, "password": "wrongpassword"}
        )
        assert response.status_code == 401, f"Expected 401, got {response.status_code}"
        print("✅ Agent login correctly rejects wrong password")
    
    def test_agent_verify_session(self):
        """POST /api/agent/verify should verify valid agent session"""
        # First login to get agent ID
        login_response = requests.post(
            f"{BASE_URL}/api/agent/login",
            json={"username": TEST_AGENT_USERNAME, "password": TEST_AGENT_PASSWORD}
        )
        assert login_response.status_code == 200
        agent_id = login_response.json()["agent"]["id"]
        
        # Verify session
        verify_response = requests.post(
            f"{BASE_URL}/api/agent/verify",
            json={"agent_id": agent_id}
        )
        assert verify_response.status_code == 200, f"Expected 200, got {verify_response.status_code}"
        
        data = verify_response.json()
        assert data.get("valid") == True, "Session should be valid"
        assert "agent" in data, "Response should contain agent info"
        
        print(f"✅ Agent session verified for: {data['agent']['name']}")
    
    def test_agent_verify_invalid_session(self):
        """POST /api/agent/verify should reject invalid agent ID"""
        response = requests.post(
            f"{BASE_URL}/api/agent/verify",
            json={"agent_id": "nonexistent-agent-id"}
        )
        # Should return 404 or valid=False
        if response.status_code == 200:
            data = response.json()
            assert data.get("valid") == False, "Invalid agent should return valid=False"
        else:
            assert response.status_code in [400, 404], f"Expected 400/404, got {response.status_code}"
        print("✅ Agent verify correctly handles invalid agent ID")


class TestAgentPermissions:
    """Test that agent has correct permissions for Service Desk"""
    
    def test_agent_has_service_desk_permission(self):
        """Agent should have service_desk permission"""
        response = requests.post(
            f"{BASE_URL}/api/agent/login",
            json={"username": TEST_AGENT_USERNAME, "password": TEST_AGENT_PASSWORD}
        )
        assert response.status_code == 200
        
        agent = response.json()["agent"]
        permissions = agent.get("permissions", [])
        
        assert "service_desk" in permissions, f"Agent should have service_desk permission. Has: {permissions}"
        print(f"✅ Agent has service_desk permission: {permissions}")
    
    def test_agent_has_notifications_permission(self):
        """Agent should have notifications permission"""
        response = requests.post(
            f"{BASE_URL}/api/agent/login",
            json={"username": TEST_AGENT_USERNAME, "password": TEST_AGENT_PASSWORD}
        )
        assert response.status_code == 200
        
        agent = response.json()["agent"]
        permissions = agent.get("permissions", [])
        
        assert "notifications" in permissions, f"Agent should have notifications permission. Has: {permissions}"
        print(f"✅ Agent has notifications permission")


class TestHealthCheck:
    """Basic health check"""
    
    def test_api_health(self):
        """API should be healthy"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data.get("status") == "healthy"
        print("✅ API is healthy")


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
