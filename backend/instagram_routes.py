"""
Instagram Feed Routes - Fetch and cache Instagram posts
For displaying real-time Instagram feeds on celebration wall

Created: March 12, 2026
"""

from fastapi import APIRouter, HTTPException
from typing import Optional, List, Dict
from datetime import datetime, timedelta
import httpx
import os
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/instagram", tags=["instagram"])

# Instagram API configuration
INSTAGRAM_ACCESS_TOKEN = os.environ.get("INSTAGRAM_ACCESS_TOKEN", "")
INSTAGRAM_ACCOUNT_ID = os.environ.get("INSTAGRAM_ACCOUNT_ID", "")

# Cache for Instagram posts (to reduce API calls)
_instagram_cache = {
    "posts": [],
    "last_fetched": None,
    "cache_duration_minutes": 30
}


@router.get("/feed")
async def get_instagram_feed(limit: int = 12):
    """
    Fetch Instagram feed posts from @the_doggy_bakery
    
    Requires:
    - INSTAGRAM_ACCESS_TOKEN in .env
    - INSTAGRAM_ACCOUNT_ID in .env
    
    To set up Instagram API:
    1. Create a Meta Developer App at https://developers.facebook.com/
    2. Add Instagram Basic Display product
    3. Generate User Access Token for your Instagram account
    4. Copy Account ID from the Instagram account settings
    5. Add to backend/.env:
       INSTAGRAM_ACCESS_TOKEN=your_token_here
       INSTAGRAM_ACCOUNT_ID=your_account_id
    """
    
    if not INSTAGRAM_ACCESS_TOKEN:
        logger.warning("Instagram API not configured - returning placeholder posts")
        return {
            "posts": get_placeholder_posts(),
            "source": "placeholder",
            "message": "Instagram API not configured. Add INSTAGRAM_ACCESS_TOKEN to backend/.env"
        }
    
    # Check cache first
    if _instagram_cache["posts"] and _instagram_cache["last_fetched"]:
        cache_age = datetime.now() - _instagram_cache["last_fetched"]
        if cache_age < timedelta(minutes=_instagram_cache["cache_duration_minutes"]):
            return {
                "posts": _instagram_cache["posts"][:limit],
                "source": "cache",
                "cached_at": _instagram_cache["last_fetched"].isoformat()
            }
    
    try:
        posts = await fetch_instagram_posts(limit)
        
        # Update cache
        _instagram_cache["posts"] = posts
        _instagram_cache["last_fetched"] = datetime.now()
        
        return {
            "posts": posts,
            "source": "instagram_api",
            "fetched_at": datetime.now().isoformat()
        }
    except Exception as e:
        logger.error(f"Error fetching Instagram posts: {e}")
        
        # Return cached data if available
        if _instagram_cache["posts"]:
            return {
                "posts": _instagram_cache["posts"][:limit],
                "source": "cache_fallback",
                "error": str(e)
            }
        
        # Return placeholder if no cache
        return {
            "posts": get_placeholder_posts(),
            "source": "placeholder",
            "error": str(e)
        }


async def fetch_instagram_posts(limit: int = 12) -> List[Dict]:
    """Fetch posts from Instagram Basic Display API"""
    
    fields = "id,caption,media_type,media_url,thumbnail_url,permalink,timestamp"
    url = f"https://graph.instagram.com/me/media?fields={fields}&access_token={INSTAGRAM_ACCESS_TOKEN}&limit={limit}"
    
    async with httpx.AsyncClient() as client:
        response = await client.get(url, timeout=15.0)
        
        if response.status_code != 200:
            logger.error(f"Instagram API error: {response.status_code} - {response.text}")
            raise Exception(f"Instagram API error: {response.status_code}")
        
        data = response.json()
        posts = []
        
        for item in data.get("data", []):
            post = {
                "id": item.get("id"),
                "caption": item.get("caption", ""),
                "media_type": item.get("media_type"),  # IMAGE, VIDEO, CAROUSEL_ALBUM
                "media_url": item.get("media_url"),
                "thumbnail_url": item.get("thumbnail_url"),
                "permalink": item.get("permalink"),
                "timestamp": item.get("timestamp"),
            }
            
            # For videos, use thumbnail
            if post["media_type"] == "VIDEO" and post["thumbnail_url"]:
                post["display_url"] = post["thumbnail_url"]
            else:
                post["display_url"] = post["media_url"]
            
            posts.append(post)
        
        return posts


def get_placeholder_posts() -> List[Dict]:
    """Return placeholder posts when Instagram API is not configured"""
    return [
        {
            "id": "placeholder_1",
            "caption": "🎂 Birthday celebrations for our furry friends! Order your custom pet cake today.",
            "media_type": "IMAGE",
            "display_url": "https://images.unsplash.com/photo-1558929996-da64ba858215?w=400&h=400&fit=crop",
            "permalink": "https://www.instagram.com/the_doggy_bakery/",
            "timestamp": datetime.now().isoformat(),
        },
        {
            "id": "placeholder_2",
            "caption": "🐾 Fresh baked treats made with love. All natural ingredients, tail-wagging approved!",
            "media_type": "IMAGE",
            "display_url": "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop",
            "permalink": "https://www.instagram.com/the_doggy_bakery/",
            "timestamp": datetime.now().isoformat(),
        },
        {
            "id": "placeholder_3",
            "caption": "🎉 Every celebration deserves a paw-some cake! Custom designs available.",
            "media_type": "IMAGE",
            "display_url": "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400&h=400&fit=crop",
            "permalink": "https://www.instagram.com/the_doggy_bakery/",
            "timestamp": datetime.now().isoformat(),
        },
        {
            "id": "placeholder_4",
            "caption": "🦴 Healthy, delicious, and made fresh daily. Your pet deserves the best!",
            "media_type": "IMAGE",
            "display_url": "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=400&h=400&fit=crop",
            "permalink": "https://www.instagram.com/the_doggy_bakery/",
            "timestamp": datetime.now().isoformat(),
        },
    ]


@router.get("/status")
async def get_instagram_status():
    """Check Instagram API configuration status"""
    return {
        "configured": bool(INSTAGRAM_ACCESS_TOKEN),
        "cache_posts_count": len(_instagram_cache["posts"]),
        "last_fetched": _instagram_cache["last_fetched"].isoformat() if _instagram_cache["last_fetched"] else None,
        "setup_instructions": """
To enable Instagram feed:
1. Go to https://developers.facebook.com/
2. Create/select your app
3. Add 'Instagram Basic Display' product
4. Go to Basic Display > Add Instagram Tester
5. Accept the invitation on your Instagram account
6. Generate User Access Token
7. Add to /app/backend/.env:
   INSTAGRAM_ACCESS_TOKEN=your_long_lived_token
   INSTAGRAM_ACCOUNT_ID=your_account_id
8. Restart backend
        """
    }


@router.post("/refresh-cache")
async def refresh_instagram_cache():
    """Force refresh the Instagram cache"""
    if not INSTAGRAM_ACCESS_TOKEN:
        raise HTTPException(status_code=400, detail="Instagram API not configured")
    
    try:
        posts = await fetch_instagram_posts(20)
        _instagram_cache["posts"] = posts
        _instagram_cache["last_fetched"] = datetime.now()
        
        return {
            "success": True,
            "posts_count": len(posts),
            "fetched_at": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
