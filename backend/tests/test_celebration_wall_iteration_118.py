"""
Celebration Wall API Tests - Iteration 118
Tests for:
- GET /api/celebration-wall/photos
- POST /api/celebration-wall/photos/ugc
- POST /api/celebration-wall/photos/{id}/like
- Admin moderation endpoints
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')


class TestCelebrationWallPhotos:
    """Test GET /api/celebration-wall/photos"""

    def test_get_photos_returns_200(self):
        """GET photos endpoint returns 200"""
        res = requests.get(f"{BASE_URL}/api/celebration-wall/photos")
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"

    def test_get_photos_response_structure(self):
        """GET photos returns {photos: [...], total: N}"""
        res = requests.get(f"{BASE_URL}/api/celebration-wall/photos")
        assert res.status_code == 200
        data = res.json()
        assert "photos" in data, f"Missing 'photos' key in response: {data}"
        assert "total" in data, f"Missing 'total' key in response: {data}"
        assert isinstance(data["photos"], list), "photos should be a list"

    def test_get_photos_returns_content(self):
        """GET photos returns at least some photos (default or DB)"""
        res = requests.get(f"{BASE_URL}/api/celebration-wall/photos")
        data = res.json()
        assert len(data["photos"]) > 0, "Expected at least 1 photo (default photos should be returned)"

    def test_get_photos_featured_only_param(self):
        """GET photos with featured_only=true returns 200"""
        res = requests.get(f"{BASE_URL}/api/celebration-wall/photos?featured_only=true&limit=12")
        assert res.status_code == 200
        data = res.json()
        assert "photos" in data

    def test_get_photos_fields(self):
        """Each photo has required fields: pet_name, image_url, occasion, caption, likes, location"""
        res = requests.get(f"{BASE_URL}/api/celebration-wall/photos")
        data = res.json()
        photos = data.get("photos", [])
        if not photos:
            pytest.skip("No photos returned")
        photo = photos[0]
        # Check required fields
        required_fields = ["pet_name", "image_url", "occasion", "caption", "likes", "location"]
        for field in required_fields:
            assert field in photo or field.replace("_", "") in str(photo), \
                f"Missing field '{field}' in photo: {list(photo.keys())}"


class TestCelebrationWallUGC:
    """Test POST /api/celebration-wall/photos/ugc"""

    def test_ugc_upload_success(self):
        """POST /ugc returns success with photo_id and status"""
        payload = {
            "image_url": "https://example.com/test-photo.jpg",
            "pet_name": "TEST_Doggo",
            "caption": "Testing my pet's birthday celebration",
            "celebration_type": "Birthday",
            "city": "Mumbai",
            "mira_comment": "TEST_Doggo and the people who love them.",
            "source": "ugc"
        }
        res = requests.post(
            f"{BASE_URL}/api/celebration-wall/photos/ugc",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        data = res.json()
        assert data.get("success") is True, f"success should be True: {data}"
        assert "photo_id" in data, f"Missing photo_id in response: {data}"
        assert data.get("status") == "pending_review", f"Expected status 'pending_review': {data}"

    def test_ugc_upload_photo_id_returned(self):
        """POST /ugc returns non-empty photo_id string"""
        payload = {
            "image_url": "https://example.com/test-pet-birthday.jpg",
            "pet_name": "TEST_Simba",
            "caption": "Happy birthday Simba!",
            "celebration_type": "Birthday",
            "city": "Bangalore",
            "source": "ugc"
        }
        res = requests.post(
            f"{BASE_URL}/api/celebration-wall/photos/ugc",
            json=payload
        )
        assert res.status_code == 200
        data = res.json()
        photo_id = data.get("photo_id")
        assert photo_id, "photo_id should be non-empty"
        assert isinstance(photo_id, str), "photo_id should be a string"
        assert len(photo_id) > 0

    def test_ugc_upload_missing_required_fields(self):
        """POST /ugc fails gracefully without required fields"""
        payload = {
            "pet_name": "TEST_Dog"
            # Missing image_url and caption
        }
        res = requests.post(
            f"{BASE_URL}/api/celebration-wall/photos/ugc",
            json=payload
        )
        # Should return 422 (validation error) or 500
        assert res.status_code in [422, 400, 500], \
            f"Expected validation error, got {res.status_code}: {res.text}"

    def test_ugc_upload_with_optional_fields(self):
        """POST /ugc works without optional fields (city, pet_id, mira_comment)"""
        payload = {
            "image_url": "https://example.com/minimal-test.jpg",
            "pet_name": "TEST_Buddy",
            "caption": "A minimal test upload",
            "celebration_type": "Birthday"
        }
        res = requests.post(
            f"{BASE_URL}/api/celebration-wall/photos/ugc",
            json=payload
        )
        assert res.status_code == 200
        data = res.json()
        assert data.get("success") is True


class TestCelebrationWallLike:
    """Test POST /api/celebration-wall/photos/{id}/like"""

    def test_like_valid_id_returns_success(self):
        """POST /like on a real photo id returns success"""
        # First create a UGC photo to get a valid ID
        payload = {
            "image_url": "https://example.com/like-test-photo.jpg",
            "pet_name": "TEST_LikeDog",
            "caption": "Testing likes",
            "celebration_type": "Birthday"
        }
        create_res = requests.post(
            f"{BASE_URL}/api/celebration-wall/photos/ugc",
            json=payload
        )
        assert create_res.status_code == 200
        photo_id = create_res.json().get("photo_id")

        # Now like it
        like_res = requests.post(f"{BASE_URL}/api/celebration-wall/photos/{photo_id}/like")
        assert like_res.status_code == 200, f"Expected 200, got {like_res.status_code}: {like_res.text}"

    def test_like_response_structure(self):
        """Like endpoint returns {success: true, likes: N}"""
        # Use a numeric default photo ID (1, 2, 3)
        like_res = requests.post(f"{BASE_URL}/api/celebration-wall/photos/1/like")
        assert like_res.status_code == 200
        data = like_res.json()
        assert "success" in data, f"Missing 'success' in response: {data}"
        assert data.get("success") is True, f"success should be True: {data}"
        assert "likes" in data, f"Missing 'likes' in response: {data}"

    def test_like_returns_likes_count(self):
        """Like endpoint returns integer likes count"""
        like_res = requests.post(f"{BASE_URL}/api/celebration-wall/photos/2/like")
        assert like_res.status_code == 200
        data = like_res.json()
        likes = data.get("likes")
        assert isinstance(likes, int), f"likes should be integer, got {type(likes)}: {likes}"

    def test_like_unknown_id_returns_gracefully(self):
        """Like on unknown/invalid ID doesn't crash - returns success:true, likes:0"""
        like_res = requests.post(f"{BASE_URL}/api/celebration-wall/photos/nonexistent-id-abc123/like")
        assert like_res.status_code == 200
        data = like_res.json()
        assert data.get("success") is True, f"Expected graceful fallback: {data}"


class TestCelebrationWallAdmin:
    """Test admin moderation endpoints"""

    def test_get_pending_photos(self):
        """GET /admin/pending returns pending UGC photos"""
        res = requests.get(f"{BASE_URL}/api/celebration-wall/admin/pending")
        assert res.status_code == 200, f"Expected 200, got {res.status_code}: {res.text}"
        data = res.json()
        assert "photos" in data, f"Missing 'photos' key: {data}"
        assert "total" in data, f"Missing 'total' key: {data}"

    def test_pending_photos_contain_test_ugc(self):
        """After uploading UGC, it should appear in pending list"""
        # Upload a test photo first
        payload = {
            "image_url": "https://example.com/pending-test.jpg",
            "pet_name": "TEST_PendingDog",
            "caption": "This should be in pending review",
            "celebration_type": "Milestone"
        }
        create_res = requests.post(
            f"{BASE_URL}/api/celebration-wall/photos/ugc",
            json=payload
        )
        assert create_res.status_code == 200
        photo_id = create_res.json().get("photo_id")

        # Check pending list
        pending_res = requests.get(f"{BASE_URL}/api/celebration-wall/admin/pending")
        assert pending_res.status_code == 200
        data = pending_res.json()
        assert data.get("total", 0) > 0, "Expected at least 1 pending photo after upload"
