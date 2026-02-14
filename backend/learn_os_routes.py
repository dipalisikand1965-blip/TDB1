"""
LEARN OS Layer - API Routes
===========================
Curated library of tiny guides + wrapped YouTube videos.
Every item ends in: Do it myself | Let Mira do it | Ask Mira

GOLDEN DOCTRINE: Pet First, Breed Second
Every Learn item is personalized based on:
1. Pet's life stage (puppy, adult, senior)
2. Pet's specific conditions (anxious, allergies, health issues)
3. Pet's breed characteristics (double_coat, brachy, floppy_ears, etc.)

NOTE: This is SEPARATE from learn_routes.py (training programs/enrollments).
This powers the LEARN OS tab - the curated content library.

Endpoints (MVP):
- GET /api/os/learn/topics - Get all topic chips
- GET /api/os/learn/home - Get Learn home screen data (with pet personalization)
- GET /api/os/learn/topic/{topic} - Content by topic (3 shelves)
- GET /api/os/learn/item/{type}/{id} - Single guide/video detail
- POST /api/os/learn/saved - Save/unsave items
- GET /api/os/learn/saved - Get user's saved items
- GET /api/os/learn/search - Search guides/videos
"""

from fastapi import APIRouter, HTTPException, Header, Query
from typing import Optional, List, Dict, Any, Tuple
from datetime import datetime, timezone
import logging
import uuid
import os
import jwt
import re

from learn_models import (
    LearnTopic, ContentType, RiskLevel,
    SaveLearnRequest, TOPIC_CONFIG
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/os/learn", tags=["learn-os"])

# Database connection
_db = None

def set_database(database):
    """Set the database instance from server.py"""
    global _db
    _db = database
    logger.info("[LEARN OS] Database connection set")

def get_db():
    return _db

# JWT Config
SECRET_KEY = os.environ.get("JWT_SECRET", "tdb_super_secret_key_2025_woof")
ALGORITHM = "HS256"


# ============================================
# HELPER FUNCTIONS
# ============================================

async def get_user_from_token(authorization: Optional[str] = None):
    """Extract user info from JWT token."""
    if not authorization:
        return None
    try:
        token = authorization.replace("Bearer ", "")
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_email = payload.get("sub") or payload.get("email")
        user_id = payload.get("user_id")
        if not user_email:
            return None
        db = get_db()
        if db is None:
            return None
        user = await db.users.find_one({"email": user_email}, {"_id": 0, "password_hash": 0})
        if user:
            user["user_id"] = user_id or user.get("id")
        return user
    except Exception as e:
        logger.warning(f"[LEARN OS] Token decode error: {e}")
        return None


def enrich_item_for_frontend(item: Dict, item_type: str, is_saved: bool = False) -> Dict:
    """Add display info to a Learn item."""
    topic_str = item.get("topic", "health")
    try:
        topic_enum = LearnTopic(topic_str)
        topic_config = TOPIC_CONFIG.get(topic_enum, {})
    except (ValueError, KeyError):
        topic_config = {}
    
    return {
        **item,
        "item_type": item_type,
        "is_saved": is_saved,
        "topic_label": topic_config.get("label", topic_str.title() if topic_str else "General"),
        "topic_icon": topic_config.get("icon", "book"),
        "topic_color": topic_config.get("color", "gray"),
        "time_display": f"{item.get('reading_time_sec', 90) // 60} min" if item_type == "guide" else f"{item.get('duration_sec', 180) // 60} min video",
    }


# ============================================
# ROUTES
# ============================================

@router.get("/topics")
async def get_learn_topics():
    """
    Get all topic chips for Learn home.
    Returns topic metadata for UI rendering.
    """
    topics = []
    for topic_enum, config in TOPIC_CONFIG.items():
        topics.append({
            "id": topic_enum.value,
            "label": config["label"],
            "icon": config["icon"],
            "color": config["color"],
            "description": config["description"]
        })
    
    return {
        "success": True,
        "topics": topics
    }


@router.get("/home")
async def get_learn_home(
    authorization: Optional[str] = Header(None)
):
    """
    Get Learn home screen data.
    Returns topics + featured content for quick display.
    """
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    
    user = await get_user_from_token(authorization)
    user_id = user.get("user_id") if user else None
    
    # Get saved items
    saved_ids = set()
    if user_id:
        saved_items = await db.learn_saved.find(
            {"user_id": user_id},
            {"item_id": 1}
        ).to_list(100)
        saved_ids = {s["item_id"] for s in saved_items}
    
    # Get topics
    topics = []
    for topic_enum, config in TOPIC_CONFIG.items():
        topics.append({
            "id": topic_enum.value,
            "label": config["label"],
            "icon": config["icon"],
            "color": config["color"],
        })
    
    # Get featured/start here items (across all topics)
    featured_guides = await db.learn_guides.find(
        {"is_active": True, "is_featured": True},
        {"_id": 0}
    ).sort("sort_rank", 1).limit(6).to_list(6)
    
    featured_videos = await db.learn_videos.find(
        {"is_active": True, "is_featured": True},
        {"_id": 0}
    ).sort("sort_rank", 1).limit(4).to_list(4)
    
    start_here = []
    for guide in featured_guides:
        start_here.append(enrich_item_for_frontend(guide, "guide", guide.get("id") in saved_ids))
    for video in featured_videos:
        start_here.append(enrich_item_for_frontend(video, "video", video.get("id") in saved_ids))
    
    # Sort by sort_rank and limit to 5
    start_here.sort(key=lambda x: x.get("sort_rank", 100))
    start_here = start_here[:5]
    
    return {
        "success": True,
        "topics": topics,
        "start_here": start_here,
        "saved_count": len(saved_ids)
    }


@router.get("/topic/{topic}")
async def get_topic_content(
    topic: str,
    authorization: Optional[str] = Header(None)
):
    """
    Get content for a specific topic, organized into 3 shelves:
    1. Start here (featured items)
    2. 2-minute guides
    3. Watch & learn (videos)
    """
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    
    user = await get_user_from_token(authorization)
    user_id = user.get("user_id") if user else None
    
    # Get user's saved items for marking
    saved_ids = set()
    if user_id:
        saved_items = await db.learn_saved.find(
            {"user_id": user_id},
            {"item_id": 1}
        ).to_list(100)
        saved_ids = {s["item_id"] for s in saved_items}
    
    # Validate topic
    topic_lower = topic.lower()
    try:
        topic_enum = LearnTopic(topic_lower)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid topic: {topic}")
    
    topic_config = TOPIC_CONFIG.get(topic_enum, {})
    
    # Fetch guides for this topic (active only)
    guides = await db.learn_guides.find(
        {"topic": topic_lower, "is_active": True},
        {"_id": 0}
    ).sort("sort_rank", 1).to_list(50)
    
    # Fetch videos for this topic (active only)
    videos = await db.learn_videos.find(
        {"topic": topic_lower, "is_active": True},
        {"_id": 0}
    ).sort("sort_rank", 1).to_list(30)
    
    # Build shelves
    start_here = []
    two_min_guides = []
    watch_learn = []
    
    for guide in guides:
        enriched = enrich_item_for_frontend(guide, "guide", guide.get("id") in saved_ids)
        if guide.get("is_featured"):
            start_here.append(enriched)
        else:
            two_min_guides.append(enriched)
    
    for video in videos:
        enriched = enrich_item_for_frontend(video, "video", video.get("id") in saved_ids)
        if video.get("is_featured"):
            start_here.append(enriched)
        else:
            watch_learn.append(enriched)
    
    # Sort start_here by sort_rank
    start_here.sort(key=lambda x: x.get("sort_rank", 100))
    
    return {
        "success": True,
        "topic": {
            "id": topic_lower,
            "label": topic_config.get("label", topic.title()),
            "icon": topic_config.get("icon", "book"),
            "color": topic_config.get("color", "gray"),
        },
        "shelves": {
            "start_here": start_here[:3],  # Max 3 per spec
            "guides": two_min_guides,
            "videos": watch_learn
        },
        "counts": {
            "start_here": min(len(start_here), 3),
            "guides": len(two_min_guides),
            "videos": len(watch_learn)
        }
    }


@router.get("/item/{item_type}/{item_id}")
async def get_learn_item(
    item_type: str,
    item_id: str,
    authorization: Optional[str] = Header(None)
):
    """
    Get single Learn item detail (guide or video).
    Returns full content for the Reader view.
    """
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    
    user = await get_user_from_token(authorization)
    user_id = user.get("user_id") if user else None
    
    # Determine collection
    if item_type == "guide":
        collection = db.learn_guides
    elif item_type == "video":
        collection = db.learn_videos
    else:
        raise HTTPException(status_code=400, detail=f"Invalid item type: {item_type}")
    
    # Fetch item
    item = await collection.find_one({"id": item_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    # Check if saved
    is_saved = False
    if user_id:
        saved = await db.learn_saved.find_one({"user_id": user_id, "item_id": item_id})
        is_saved = saved is not None
    
    # Increment view count (fire and forget)
    await collection.update_one(
        {"id": item_id},
        {"$inc": {"view_count": 1}}
    )
    
    enriched = enrich_item_for_frontend(item, item_type, is_saved)
    
    return {
        "success": True,
        "item": enriched
    }


@router.get("/search")
async def search_learn(
    q: str = Query(..., min_length=2, description="Search query"),
    topic: Optional[str] = Query(None, description="Filter by topic"),
    limit: int = Query(20, le=50),
    authorization: Optional[str] = Header(None)
):
    """
    Search Learn content across guides and videos.
    Returns unified results sorted by relevance.
    """
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    
    user = await get_user_from_token(authorization)
    user_id = user.get("user_id") if user else None
    
    # Get saved items
    saved_ids = set()
    if user_id:
        saved_items = await db.learn_saved.find(
            {"user_id": user_id},
            {"item_id": 1}
        ).to_list(100)
        saved_ids = {s["item_id"] for s in saved_items}
    
    # Build search filter
    search_filter = {
        "is_active": True,
        "$or": [
            {"title": {"$regex": q, "$options": "i"}},
            {"summary": {"$regex": q, "$options": "i"}},
            {"steps": {"$elemMatch": {"$regex": q, "$options": "i"}}},
        ]
    }
    if topic:
        search_filter["topic"] = topic.lower()
    
    # Search guides
    guides = await db.learn_guides.find(
        search_filter,
        {"_id": 0}
    ).limit(limit).to_list(limit)
    
    # Search videos (adjust filter for video-specific fields)
    video_filter = {
        "is_active": True,
        "$or": [
            {"title": {"$regex": q, "$options": "i"}},
            {"bullets_before": {"$elemMatch": {"$regex": q, "$options": "i"}}},
        ]
    }
    if topic:
        video_filter["topic"] = topic.lower()
    
    videos = await db.learn_videos.find(
        video_filter,
        {"_id": 0}
    ).limit(limit).to_list(limit)
    
    # Combine and enrich results
    results = []
    for guide in guides:
        results.append(enrich_item_for_frontend(guide, "guide", guide.get("id") in saved_ids))
    for video in videos:
        results.append(enrich_item_for_frontend(video, "video", video.get("id") in saved_ids))
    
    return {
        "success": True,
        "query": q,
        "results": results[:limit],
        "counts": {
            "guides": len(guides),
            "videos": len(videos),
            "total": len(results)
        }
    }


@router.post("/saved")
async def save_learn_item(
    request: SaveLearnRequest,
    authorization: Optional[str] = Header(None)
):
    """
    Save or unsave a Learn item.
    Saved items appear in the Saved Learn shelf.
    """
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    
    user = await get_user_from_token(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    user_id = user.get("user_id")
    
    # Get item details for denormalization
    if request.item_type == ContentType.GUIDE:
        item = await db.learn_guides.find_one({"id": request.item_id}, {"_id": 0})
        collection = db.learn_guides
    else:
        item = await db.learn_videos.find_one({"id": request.item_id}, {"_id": 0})
        collection = db.learn_videos
    
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    if request.action == "save":
        # Check if already saved
        existing = await db.learn_saved.find_one({
            "user_id": user_id,
            "item_id": request.item_id
        })
        
        if not existing:
            saved_item = {
                "user_id": user_id,
                "item_id": request.item_id,
                "item_type": request.item_type.value,
                "saved_at": datetime.now(timezone.utc),
                "title": item.get("title"),
                "topic": item.get("topic"),
                "reading_time_sec": item.get("reading_time_sec"),
                "duration_sec": item.get("duration_sec"),
            }
            await db.learn_saved.insert_one(saved_item)
            
            # Increment save count
            await collection.update_one(
                {"id": request.item_id},
                {"$inc": {"save_count": 1}}
            )
        
        return {"success": True, "action": "saved", "item_id": request.item_id}
    
    elif request.action == "unsave":
        result = await db.learn_saved.delete_one({
            "user_id": user_id,
            "item_id": request.item_id
        })
        
        if result.deleted_count > 0:
            # Decrement save count
            await collection.update_one(
                {"id": request.item_id},
                {"$inc": {"save_count": -1}}
            )
        
        return {"success": True, "action": "unsaved", "item_id": request.item_id}
    
    else:
        raise HTTPException(status_code=400, detail="Invalid action. Use 'save' or 'unsave'")


@router.get("/saved")
async def get_saved_items(
    authorization: Optional[str] = Header(None)
):
    """
    Get user's saved Learn items.
    Returns items grouped by type (guides, videos).
    """
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    
    user = await get_user_from_token(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    user_id = user.get("user_id")
    
    # Get all saved items
    saved_items = await db.learn_saved.find(
        {"user_id": user_id},
        {"_id": 0}
    ).sort("saved_at", -1).to_list(100)
    
    # Group by type
    saved_guides = []
    saved_videos = []
    
    for item in saved_items:
        if item.get("item_type") == "guide":
            saved_guides.append({
                **item,
                "is_saved": True,
                "time_display": f"{item.get('reading_time_sec', 90) // 60} min"
            })
        else:
            saved_videos.append({
                **item,
                "is_saved": True,
                "time_display": f"{item.get('duration_sec', 180) // 60} min video"
            })
    
    return {
        "success": True,
        "saved": {
            "guides": saved_guides,
            "videos": saved_videos
        },
        "counts": {
            "guides": len(saved_guides),
            "videos": len(saved_videos),
            "total": len(saved_items)
        }
    }
