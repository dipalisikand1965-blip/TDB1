#!/usr/bin/env python3
"""
Backend API Testing for Doggy Company / Mira Pet Life Operating System
Tests all the key endpoints requested in the review requirements.
"""

import requests
import json
import sys
from datetime import datetime
from typing import Dict, Any

class DoggyCompanyAPITester:
    def __init__(self, base_url="https://cms-architecture-lab.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        
        # Test credentials from review request  
        self.test_email = "dipali@clubconcierge.in"
        self.test_password = "lola4304"  # Correct password from backend/.env

    def log_test(self, name: str, success: bool, response_data: Dict = None, error: str = None):
        """Log a test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            
        result = {
            "test": name,
            "success": success,
            "timestamp": datetime.now().isoformat(),
        }
        
        if error:
            result["error"] = error
        if response_data:
            result["response"] = response_data
            
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"\n{status} - {name}")
        if error:
            print(f"   Error: {error}")
        if response_data and success:
            print(f"   Response keys: {list(response_data.keys()) if isinstance(response_data, dict) else 'Non-dict response'}")

    def run_test(self, name: str, method: str, endpoint: str, expected_status: int, 
                 data: Dict = None, headers: Dict = None) -> tuple[bool, Dict]:
        """Run a single API test"""
        url = f"{self.base_url}{endpoint}"
        
        if headers is None:
            headers = {'Content-Type': 'application/json'}
        
        if self.token and 'Authorization' not in headers:
            headers['Authorization'] = f'Bearer {self.token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=30)
            else:
                self.log_test(name, False, error=f"Unsupported method: {method}")
                return False, {}

            success = response.status_code == expected_status
            
            try:
                response_data = response.json() if response.content else {}
            except json.JSONDecodeError:
                response_data = {"raw_response": response.text}
            
            if success:
                self.log_test(name, True, response_data)
                return True, response_data
            else:
                self.log_test(name, False, response_data, 
                            f"Expected status {expected_status}, got {response.status_code}")
                return False, response_data
                
        except requests.exceptions.Timeout:
            self.log_test(name, False, error="Request timed out")
            return False, {}
        except requests.exceptions.RequestException as e:
            self.log_test(name, False, error=f"Request failed: {str(e)}")
            return False, {}
        except Exception as e:
            self.log_test(name, False, error=f"Unexpected error: {str(e)}")
            return False, {}

    def test_login_flow(self):
        """Test the login flow with provided credentials"""
        print("\n🔐 Testing Login Flow...")
        
        success, response = self.run_test(
            "Login with dipali@clubconcierge.in",
            "POST",
            "/api/auth/login",
            200,
            {
                "email": self.test_email,
                "password": self.test_password
            }
        )
        
        if success and 'access_token' in response:
            self.token = response['access_token']
            print(f"   ✓ Login successful, token received")
            return True
        elif success and 'token' in response:
            self.token = response['token']
            print(f"   ✓ Login successful, token received")
            return True
        else:
            print(f"   ❌ Login failed or no token in response")
            return False

    def test_paw_points_api(self):
        """Test Paw Points balance API"""
        print("\n🐾 Testing Paw Points API...")
        
        if not self.token:
            self.log_test("Paw Points Balance", False, error="No authentication token")
            return False
            
        success, response = self.run_test(
            "Get Paw Points Balance",
            "GET",
            "/api/paw-points/balance",
            200
        )
        
        return success and 'balance' in response

    def test_mira_chat_api(self):
        """Test Mira AI chat API"""
        print("\n🤖 Testing Mira Chat AI API...")
        
        success, response = self.run_test(
            "Mira Chat - Pet Care Question",
            "POST",
            "/api/mira/chat",
            200,
            {
                "message": "What should I feed my dog?",
                "user_id": "test_user",
                "session_id": "test_session_001"
            }
        )
        
        return success and ('response' in response or 'message' in response or 'content' in response)

    def test_os_learn_api(self):
        """Test OS LEARN content API"""
        print("\n📚 Testing OS LEARN API...")
        
        success, response = self.run_test(
            "Get LEARN Home Content",
            "GET",
            "/api/os/learn/home",
            200
        )
        
        # Accept various response structures for learn content
        has_content = (
            success and (
                'content' in response or 
                'videos' in response or 
                'articles' in response or 
                'categories' in response or
                'learn_content' in response or
                len(response) > 0
            )
        )
        
        return has_content

    def test_health_check(self):
        """Test basic health check"""
        print("\n🏥 Testing Health Check...")
        
        success, response = self.run_test(
            "API Health Check",
            "GET",
            "/api/health",
            200
        )
        
        return success

    def test_pet_soul_api(self):
        """Test Pet Soul related APIs"""
        print("\n✨ Testing Pet Soul API...")
        
        # Test getting pet soul questions
        success, response = self.run_test(
            "Get Pet Soul Questions",
            "GET",
            "/pet-soul/questions",
            200
        )
        
        return success and 'folders' in response

    def run_all_tests(self):
        """Run all backend API tests"""
        print("=" * 60)
        print("🐕 DOGGY COMPANY BACKEND API TESTS")
        print(f"Testing against: {self.base_url}")
        print("=" * 60)
        
        # Start with health check
        self.test_health_check()
        
        # Test login flow (required for authenticated endpoints)
        login_success = self.test_login_flow()
        
        # Test core APIs from review requirements
        self.test_mira_chat_api()
        self.test_os_learn_api()
        
        if login_success:
            self.test_paw_points_api()
        
        # Test Pet Soul (public endpoint)
        self.test_pet_soul_api()
        
        # Print final summary
        print("\n" + "=" * 60)
        print("📊 BACKEND TEST RESULTS SUMMARY")
        print("=" * 60)
        print(f"Tests Run: {self.tests_run}")
        print(f"Tests Passed: {self.tests_passed}")
        print(f"Success Rate: {(self.tests_passed/self.tests_run)*100:.1f}%")
        
        if self.tests_passed == self.tests_run:
            print("\n🎉 ALL BACKEND TESTS PASSED!")
        else:
            print(f"\n⚠️  {self.tests_run - self.tests_passed} test(s) failed")
            
        # Print failed tests
        failed_tests = [r for r in self.test_results if not r['success']]
        if failed_tests:
            print("\n❌ Failed Tests:")
            for test in failed_tests:
                print(f"   • {test['test']}: {test.get('error', 'Unknown error')}")
        
        return self.tests_passed == self.tests_run

def main():
    """Main test runner"""
    tester = DoggyCompanyAPITester()
    
    try:
        all_passed = tester.run_all_tests()
        return 0 if all_passed else 1
    except KeyboardInterrupt:
        print("\n\n🛑 Tests interrupted by user")
        return 1
    except Exception as e:
        print(f"\n\n💥 Test runner error: {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main())