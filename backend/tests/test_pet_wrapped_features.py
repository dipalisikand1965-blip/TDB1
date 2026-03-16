"""
Pet Wrapped Features Test Suite
Tests: Instagram Stories, Birthday/Annual Triggers, Share Logging

Features tested:
1. GET /api/wrapped/instagram-story/{pet_id} - Instagram story card (1080x1920 HTML)
2. GET /api/wrapped/share-assets/{pet_id} - Share URLs and instructions
3. POST /api/wrapped/log-share/{pet_id}?platform=instagram - Log share action
4. POST /api/wrapped/trigger-birthday/{pet_id} - Birthday wrapped delivery
5. POST /api/wrapped/trigger-annual/{pet_id} - Annual wrapped delivery
"""

import pytest
import requests
import os

# Use public API URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://nutrition-engine-ui.preview.emergentagent.com')

# Test Pet ID from the problem statement
TEST_PET_ID = "699fa0a513e44c977327ad57"  # Mystique


class TestInstagramStoryCard:
    """Test Instagram Story Card generation endpoint"""
    
    def test_instagram_story_card_returns_html(self):
        """GET /api/wrapped/instagram-story/{pet_id} should return HTML"""
        response = requests.get(f"{BASE_URL}/api/wrapped/instagram-story/{TEST_PET_ID}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        # Should return HTML content
        content_type = response.headers.get('content-type', '')
        assert 'text/html' in content_type, f"Expected HTML content-type, got {content_type}"
        
        # Validate HTML contains key elements
        html_content = response.text
        assert '<!DOCTYPE html>' in html_content, "Missing DOCTYPE"
        assert '1080' in html_content, "Missing 1080px width reference (Instagram Stories dimension)"
        assert '1920' in html_content, "Missing 1920px height reference (Instagram Stories dimension)"
        assert 'PET WRAPPED' in html_content.upper() or 'SOUL SCORE' in html_content.upper(), "Missing Pet Wrapped branding"
        print(f"✓ Instagram story card returned {len(html_content)} bytes of HTML")
    
    def test_instagram_story_card_invalid_pet(self):
        """GET /api/wrapped/instagram-story/{invalid_pet_id} should return 404"""
        response = requests.get(f"{BASE_URL}/api/wrapped/instagram-story/invalid-pet-id-12345")
        
        assert response.status_code == 404, f"Expected 404 for invalid pet, got {response.status_code}"
        print("✓ Invalid pet ID returns 404 as expected")


class TestShareAssets:
    """Test Share Assets endpoint for pet wrapped"""
    
    def test_share_assets_returns_urls(self):
        """GET /api/wrapped/share-assets/{pet_id} should return share URLs"""
        response = requests.get(f"{BASE_URL}/api/wrapped/share-assets/{TEST_PET_ID}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Validate response structure
        assert "pet_id" in data, "Missing pet_id"
        assert "pet_name" in data, "Missing pet_name"
        assert "share_text" in data, "Missing share_text"
        assert "assets" in data, "Missing assets object"
        assert "share_links" in data, "Missing share_links object"
        assert "instructions" in data, "Missing instructions object"
        
        # Validate assets URLs
        assets = data["assets"]
        assert "instagram_story" in assets, "Missing instagram_story asset"
        assert "download_html" in assets, "Missing download_html asset"
        assert "web_card" in assets, "Missing web_card asset"
        
        # Validate share links
        share_links = data["share_links"]
        assert "whatsapp" in share_links, "Missing WhatsApp share link"
        assert "twitter" in share_links, "Missing Twitter share link"
        assert "facebook" in share_links, "Missing Facebook share link"
        
        # Validate instructions exist
        instructions = data["instructions"]
        assert "instagram_story" in instructions, "Missing Instagram story instructions"
        assert len(instructions["instagram_story"]) >= 3, "Instagram instructions should have at least 3 steps"
        
        print(f"✓ Share assets returned for pet: {data['pet_name']}")
        print(f"  - Instagram Story URL: {assets['instagram_story']}")
        print(f"  - Instructions: {len(instructions['instagram_story'])} steps")
    
    def test_share_assets_invalid_pet(self):
        """GET /api/wrapped/share-assets/{invalid_pet_id} should return 404"""
        response = requests.get(f"{BASE_URL}/api/wrapped/share-assets/invalid-pet-id-12345")
        
        assert response.status_code == 404, f"Expected 404 for invalid pet, got {response.status_code}"
        print("✓ Invalid pet ID returns 404 as expected")


class TestLogShare:
    """Test Share Logging endpoint"""
    
    def test_log_instagram_share(self):
        """POST /api/wrapped/log-share/{pet_id}?platform=instagram should log share"""
        response = requests.post(f"{BASE_URL}/api/wrapped/log-share/{TEST_PET_ID}?platform=instagram")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, "Expected success: true"
        assert data.get("platform") == "instagram", f"Expected platform: instagram, got {data.get('platform')}"
        
        print(f"✓ Instagram share logged successfully")
    
    def test_log_whatsapp_share(self):
        """POST /api/wrapped/log-share/{pet_id}?platform=whatsapp should log share"""
        response = requests.post(f"{BASE_URL}/api/wrapped/log-share/{TEST_PET_ID}?platform=whatsapp")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, "Expected success: true"
        assert data.get("platform") == "whatsapp", f"Expected platform: whatsapp, got {data.get('platform')}"
        
        print(f"✓ WhatsApp share logged successfully")
    
    def test_log_share_default_platform(self):
        """POST /api/wrapped/log-share/{pet_id} without platform should log as unknown"""
        response = requests.post(f"{BASE_URL}/api/wrapped/log-share/{TEST_PET_ID}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, "Expected success: true"
        assert data.get("platform") == "unknown", f"Expected platform: unknown, got {data.get('platform')}"
        
        print(f"✓ Share without platform logged as 'unknown'")


class TestBirthdayWrappedTrigger:
    """Test Birthday Wrapped trigger endpoint"""
    
    def test_trigger_birthday_wrapped(self):
        """POST /api/wrapped/trigger-birthday/{pet_id} should trigger birthday wrapped"""
        response = requests.post(f"{BASE_URL}/api/wrapped/trigger-birthday/{TEST_PET_ID}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, "Expected success: true"
        assert data.get("pet_id") == TEST_PET_ID, f"Expected pet_id to match"
        assert data.get("wrapped_type") == "birthday", f"Expected wrapped_type: birthday"
        assert "pet_name" in data, "Missing pet_name in response"
        assert "delivery" in data, "Missing delivery status in response"
        
        print(f"✓ Birthday Wrapped triggered for: {data.get('pet_name')}")
        print(f"  - Age: {data.get('age')}")
        print(f"  - Delivery: {data.get('delivery')}")
    
    def test_trigger_birthday_invalid_pet(self):
        """POST /api/wrapped/trigger-birthday/{invalid_pet_id} should return 404"""
        response = requests.post(f"{BASE_URL}/api/wrapped/trigger-birthday/invalid-pet-id-12345")
        
        assert response.status_code == 404, f"Expected 404 for invalid pet, got {response.status_code}"
        print("✓ Invalid pet ID returns 404 as expected")


class TestAnnualWrappedTrigger:
    """Test Annual Wrapped (Year in Review) trigger endpoint"""
    
    def test_trigger_annual_wrapped(self):
        """POST /api/wrapped/trigger-annual/{pet_id} should trigger annual wrapped"""
        response = requests.post(f"{BASE_URL}/api/wrapped/trigger-annual/{TEST_PET_ID}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, "Expected success: true"
        assert data.get("pet_id") == TEST_PET_ID, f"Expected pet_id to match"
        assert data.get("wrapped_type") == "annual", f"Expected wrapped_type: annual"
        assert "year" in data, "Missing year in response"
        assert "stats" in data, "Missing stats in response"
        assert "delivery" in data, "Missing delivery status in response"
        
        print(f"✓ Annual Wrapped triggered for: {data.get('pet_name')}")
        print(f"  - Year: {data.get('year')}")
        print(f"  - Stats: {data.get('stats')}")
        print(f"  - Delivery: {data.get('delivery')}")
    
    def test_trigger_annual_with_custom_year(self):
        """POST /api/wrapped/trigger-annual/{pet_id} with year param"""
        response = requests.post(
            f"{BASE_URL}/api/wrapped/trigger-annual/{TEST_PET_ID}",
            json={"year": 2025}
        )
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # The API may or may not honor custom year, but should still succeed
        assert data.get("success") == True, "Expected success: true"
        
        print(f"✓ Annual Wrapped with custom year triggered")
    
    def test_trigger_annual_invalid_pet(self):
        """POST /api/wrapped/trigger-annual/{invalid_pet_id} should return 404"""
        response = requests.post(f"{BASE_URL}/api/wrapped/trigger-annual/invalid-pet-id-12345")
        
        assert response.status_code == 404, f"Expected 404 for invalid pet, got {response.status_code}"
        print("✓ Invalid pet ID returns 404 as expected")


class TestWelcomeWrappedTrigger:
    """Test Welcome Wrapped trigger (for completeness)"""
    
    def test_trigger_welcome_wrapped(self):
        """POST /api/wrapped/trigger-welcome/{pet_id} should trigger welcome wrapped"""
        response = requests.post(f"{BASE_URL}/api/wrapped/trigger-welcome/{TEST_PET_ID}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        assert data.get("success") == True, "Expected success: true"
        assert "pet_name" in data, "Missing pet_name"
        assert "soul_score" in data, "Missing soul_score"
        assert "delivery" in data, "Missing delivery object"
        
        print(f"✓ Welcome Wrapped triggered for: {data.get('pet_name')}")
        print(f"  - Soul Score: {data.get('soul_score')}")


class TestDeliveryStatus:
    """Test Delivery Status endpoint"""
    
    def test_get_delivery_status(self):
        """GET /api/wrapped/delivery-status/{pet_id} should return delivery info"""
        response = requests.get(f"{BASE_URL}/api/wrapped/delivery-status/{TEST_PET_ID}")
        
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        # May or may not have delivery depending on previous tests
        if data.get("found"):
            assert "delivery" in data, "Missing delivery object when found=true"
            print(f"✓ Delivery status found: {data.get('delivery')}")
        else:
            print(f"✓ No delivery history found (expected if this is first test run)")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
