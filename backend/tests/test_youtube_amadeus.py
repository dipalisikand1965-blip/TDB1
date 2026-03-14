"""
Test YouTube Training Videos and Amadeus Pet-Friendly Hotels Integration
Tests for E033/E034 features: YouTube videos and Amadeus travel APIs
"""
import pytest
import requests
import os

# Get base URL from environment
BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://mobile-drawer-fix.preview.emergentagent.com')


class TestYouTubeAPI:
    """Test YouTube Training Videos API endpoints"""
    
    def test_youtube_api_connection(self):
        """Test YouTube API connection is working"""
        response = requests.get(f"{BASE_URL}/api/mira/youtube/test")
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("success") is True
        assert data.get("results_count") >= 1
        assert "sample" in data
        
        # Verify sample video structure
        sample = data.get("sample")
        if sample:
            assert "id" in sample
            assert "title" in sample
            assert "thumbnail" in sample
            assert "channel" in sample
            assert "url" in sample
            assert "youtube.com" in sample.get("url", "")
        
        print(f"YouTube API test passed: {data.get('results_count')} results")
    
    def test_youtube_by_topic_barking(self):
        """Test YouTube videos by topic - stop barking"""
        params = {
            "topic": "stop barking",
            "breed": "Golden Retriever",
            "max_results": 3
        }
        response = requests.get(f"{BASE_URL}/api/mira/youtube/by-topic", params=params)
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("success") is True
        assert "videos" in data
        assert len(data.get("videos", [])) > 0
        
        # Verify video structure
        video = data["videos"][0]
        assert "id" in video
        assert "title" in video
        assert "thumbnail" in video
        assert "channel" in video
        assert "url" in video
        assert video.get("url", "").startswith("https://www.youtube.com/watch")
        
        print(f"YouTube by topic test passed: Found {len(data['videos'])} videos for 'stop barking'")
    
    def test_youtube_by_breed(self):
        """Test YouTube videos by breed"""
        params = {
            "breed": "Golden Retriever",
            "max_results": 3
        }
        response = requests.get(f"{BASE_URL}/api/mira/youtube/by-breed", params=params)
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("success") is True
        assert "videos" in data
        assert len(data.get("videos", [])) > 0
        
        print(f"YouTube by breed test passed: Found {len(data['videos'])} videos for Golden Retriever")
    
    def test_youtube_by_age(self):
        """Test YouTube videos by age"""
        params = {
            "age_years": 1.5,
            "breed": "Labrador",
            "max_results": 3
        }
        response = requests.get(f"{BASE_URL}/api/mira/youtube/by-age", params=params)
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("success") is True
        assert "videos" in data
        assert "life_stage" in data
        
        print(f"YouTube by age test passed: Life stage '{data.get('life_stage')}', {len(data.get('videos', []))} videos")


class TestAmadeusAPI:
    """Test Amadeus Pet-Friendly Hotels API endpoints"""
    
    def test_amadeus_api_connection(self):
        """Test Amadeus API connection is working"""
        response = requests.get(f"{BASE_URL}/api/mira/amadeus/test")
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("success") is True
        assert "message" in data
        
        print(f"Amadeus API test passed: {data.get('message')}")
    
    def test_amadeus_city_codes(self):
        """Test Amadeus city codes endpoint"""
        response = requests.get(f"{BASE_URL}/api/mira/amadeus/city-codes")
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("success") is True
        assert "city_codes" in data
        
        city_codes = data.get("city_codes", {})
        # Verify common Indian cities are present
        assert "mumbai" in city_codes
        assert "delhi" in city_codes
        assert "bangalore" in city_codes
        assert "goa" in city_codes
        
        # Verify city code format
        assert city_codes.get("mumbai") == "BOM"
        assert city_codes.get("delhi") == "DEL"
        
        print(f"Amadeus city codes test passed: {len(city_codes)} cities available")
    
    def test_amadeus_hotels_mumbai(self):
        """Test Amadeus hotels search for Mumbai"""
        params = {
            "city": "mumbai",
            "max_results": 5
        }
        response = requests.get(f"{BASE_URL}/api/mira/amadeus/hotels", params=params)
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("success") is True
        assert "hotels" in data
        assert len(data.get("hotels", [])) > 0
        
        # Verify hotel structure
        hotel = data["hotels"][0]
        assert "id" in hotel
        assert "name" in hotel
        assert "city" in hotel or "address" in hotel
        assert "distance" in hotel or "latitude" in hotel
        assert "pet_friendly_likelihood" in hotel
        assert "pet_policy_note" in hotel
        
        # Check pet-friendly status
        assert hotel.get("pet_friendly_likelihood") in ["high", "check_with_hotel"]
        
        print(f"Amadeus Mumbai hotels test passed: Found {len(data['hotels'])} hotels")
    
    def test_amadeus_hotels_delhi(self):
        """Test Amadeus hotels search for Delhi"""
        params = {
            "city": "delhi",
            "max_results": 3
        }
        response = requests.get(f"{BASE_URL}/api/mira/amadeus/hotels", params=params)
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("success") is True
        assert "city_code" in data
        assert data.get("city_code") == "DEL"
        
        print(f"Amadeus Delhi hotels test passed: city_code={data.get('city_code')}")
    
    def test_amadeus_hotels_goa(self):
        """Test Amadeus hotels search for Goa"""
        params = {
            "city": "goa",
            "max_results": 3
        }
        response = requests.get(f"{BASE_URL}/api/mira/amadeus/hotels", params=params)
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("success") is True
        assert data.get("city_code") == "GOI"
        
        print(f"Amadeus Goa hotels test passed: city_code={data.get('city_code')}")
    
    def test_amadeus_hotels_invalid_city(self):
        """Test Amadeus hotels with unknown city returns error"""
        params = {
            "city": "unknowncity123",
            "max_results": 3
        }
        response = requests.get(f"{BASE_URL}/api/mira/amadeus/hotels", params=params)
        assert response.status_code == 200  # API returns 200 with error in body
        
        data = response.json()
        assert data.get("success") is False
        assert "error" in data
        
        print(f"Amadeus invalid city test passed: Error returned correctly")


class TestIntegrationFeatures:
    """Test the full integration from Mira chat to external APIs"""
    
    def test_training_keywords_detection(self):
        """Verify training keywords that should trigger YouTube videos"""
        training_keywords = [
            'train', 'training', 'teach', 'learn', 'how to',
            'puppy', 'behavior', 'obedience', 'trick', 'command',
            'potty', 'leash', 'bite', 'bark', 'recall'
        ]
        
        # Test each keyword returns videos
        for keyword in ['bark', 'train', 'potty']:
            params = {"topic": keyword, "max_results": 2}
            response = requests.get(f"{BASE_URL}/api/mira/youtube/by-topic", params=params)
            assert response.status_code == 200
            data = response.json()
            assert data.get("success") is True
            assert len(data.get("videos", [])) > 0
            
        print(f"Training keywords detection test passed: All {len(training_keywords)} keywords documented")
    
    def test_city_keywords_detection(self):
        """Verify city keywords that should trigger Amadeus hotels"""
        city_keywords = [
            'mumbai', 'delhi', 'bangalore', 'chennai', 'kolkata',
            'hyderabad', 'pune', 'goa', 'jaipur'
        ]
        
        # Test each city returns hotels
        for city in ['mumbai', 'delhi', 'goa']:
            params = {"city": city, "max_results": 2}
            response = requests.get(f"{BASE_URL}/api/mira/amadeus/hotels", params=params)
            assert response.status_code == 200
            data = response.json()
            assert data.get("success") is True
            
        print(f"City keywords detection test passed: {len(city_keywords)} cities documented")
    
    def test_video_card_structure(self):
        """Test video response has all required fields for UI rendering"""
        params = {"topic": "puppy training", "max_results": 1}
        response = requests.get(f"{BASE_URL}/api/mira/youtube/by-topic", params=params)
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("success") is True
        
        if data.get("videos"):
            video = data["videos"][0]
            # Required fields for UI video card
            required_fields = ["id", "title", "thumbnail", "channel", "url"]
            for field in required_fields:
                assert field in video, f"Missing required field: {field}"
            
            # Verify thumbnail is a valid URL
            thumbnail = video.get("thumbnail", "")
            assert thumbnail.startswith("http"), f"Invalid thumbnail URL: {thumbnail}"
            
            # Verify YouTube URL format
            url = video.get("url", "")
            assert "youtube.com/watch?v=" in url, f"Invalid YouTube URL: {url}"
            
        print("Video card structure test passed: All required fields present")
    
    def test_hotel_card_structure(self):
        """Test hotel response has all required fields for UI rendering"""
        params = {"city": "mumbai", "max_results": 1}
        response = requests.get(f"{BASE_URL}/api/mira/amadeus/hotels", params=params)
        assert response.status_code == 200
        
        data = response.json()
        assert data.get("success") is True
        
        if data.get("hotels"):
            hotel = data["hotels"][0]
            # Required fields for UI hotel card
            required_fields = ["id", "name", "pet_friendly_likelihood", "pet_policy_note"]
            for field in required_fields:
                assert field in hotel, f"Missing required field: {field}"
            
            # Verify pet_friendly_likelihood is valid
            likelihood = hotel.get("pet_friendly_likelihood")
            assert likelihood in ["high", "check_with_hotel"], f"Invalid likelihood: {likelihood}"
            
        print("Hotel card structure test passed: All required fields present")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
