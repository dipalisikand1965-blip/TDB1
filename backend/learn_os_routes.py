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
# PET PERSONALIZATION - "Pet First, Breed Second"
# ============================================

# Breed to tag mapping (breed characteristics)
BREED_TAG_MAP = {
    # Brachycephalic breeds (flat-faced)
    "pug": ["brachy", "toy", "short_coat"],
    "bulldog": ["brachy", "short_coat"],
    "french bulldog": ["brachy", "toy", "short_coat"],
    "boston terrier": ["brachy", "toy", "short_coat"],
    "boxer": ["brachy", "large"],
    "shih tzu": ["brachy", "long_coat", "toy"],
    "pekingese": ["brachy", "long_coat", "toy"],
    "cavalier king charles": ["brachy", "floppy_ears", "long_coat"],
    
    # Double-coated breeds
    "husky": ["double_coat", "large", "high_energy"],
    "siberian husky": ["double_coat", "large", "high_energy"],
    "golden retriever": ["double_coat", "golden", "floppy_ears", "large"],
    "labrador": ["double_coat", "floppy_ears", "large"],
    "labrador retriever": ["double_coat", "floppy_ears", "large"],
    "german shepherd": ["double_coat", "gsd", "large"],
    "gsd": ["double_coat", "gsd", "large"],
    "samoyed": ["double_coat", "large"],
    "chow chow": ["double_coat", "large"],
    "akita": ["double_coat", "large"],
    "malamute": ["double_coat", "giant"],
    "pomeranian": ["double_coat", "toy"],
    "spitz": ["double_coat"],
    "indian spitz": ["double_coat"],
    "corgi": ["double_coat", "herding"],
    "border collie": ["double_coat", "herding", "high_energy"],
    "australian shepherd": ["double_coat", "herding", "high_energy"],
    
    # Floppy-eared breeds
    "beagle": ["floppy_ears", "hound"],
    "basset hound": ["floppy_ears", "hound"],
    "cocker spaniel": ["floppy_ears", "spaniel", "long_coat"],
    "springer spaniel": ["floppy_ears", "spaniel"],
    "bloodhound": ["floppy_ears", "hound", "giant"],
    "dachshund": ["floppy_ears", "toy"],
    
    # Giant breeds
    "great dane": ["giant", "short_coat"],
    "saint bernard": ["giant", "double_coat"],
    "bernese mountain dog": ["giant", "double_coat"],
    "mastiff": ["giant", "short_coat"],
    "newfoundland": ["giant", "double_coat"],
    "irish wolfhound": ["giant"],
    
    # Toy breeds
    "chihuahua": ["toy", "short_coat"],
    "yorkshire terrier": ["toy", "long_coat", "terrier"],
    "yorkie": ["toy", "long_coat", "terrier"],
    "maltese": ["toy", "long_coat"],
    "toy poodle": ["toy", "curly_coat"],
    "miniature poodle": ["toy", "curly_coat"],
    "papillon": ["toy", "long_coat"],
    
    # Curly-coated breeds
    "poodle": ["curly_coat"],
    "standard poodle": ["curly_coat", "large"],
    "bichon frise": ["curly_coat", "toy"],
    "cockapoo": ["curly_coat"],
    "labradoodle": ["curly_coat", "large"],
    "goldendoodle": ["curly_coat", "large"],
    "portuguese water dog": ["curly_coat"],
    
    # Terriers
    "jack russell": ["terrier", "high_energy"],
    "jack russell terrier": ["terrier", "high_energy"],
    "fox terrier": ["terrier", "high_energy"],
    "scottish terrier": ["terrier"],
    "west highland terrier": ["terrier"],
    "westie": ["terrier"],
    "bull terrier": ["terrier"],
    "airedale": ["terrier", "large"],
    
    # Herding breeds
    "sheltie": ["herding", "double_coat"],
    "shetland sheepdog": ["herding", "double_coat"],
    "collie": ["herding", "double_coat", "large"],
    "belgian malinois": ["herding", "high_energy", "large"],
    
    # Indian breeds
    "indie": ["indian", "short_coat"],
    "indian pariah": ["indian", "short_coat"],
    "rajapalayam": ["indian", "large", "short_coat"],
    "mudhol hound": ["indian", "hound"],
    "combai": ["indian", "large"],
}


def derive_pet_tags_from_profile(pet_data: Dict) -> Tuple[List[str], List[str]]:
    """
    Golden Doctrine: Pet First, Breed Second
    
    Derives pet_tags and breed_tags from a pet's profile.
    Used to match content that's most relevant to this specific pet.
    
    Returns: (pet_tags, breed_tags)
    """
    pet_tags = []
    breed_tags = []
    
    if not pet_data:
        return ["all"], []
    
    # ===== PET TAGS (Life stage, conditions, behaviors) =====
    
    # 1. Age-based tags
    age_years = None
    age_str = pet_data.get("age") or pet_data.get("age_display") or ""
    
    # Try to extract age from different formats
    if isinstance(age_str, (int, float)):
        age_years = float(age_str)
    elif isinstance(age_str, str):
        # Match patterns like "3 years", "2.5 years", "1 year"
        match = re.search(r'(\d+\.?\d*)\s*(?:years?|yrs?)?', age_str.lower())
        if match:
            age_years = float(match.group(1))
    
    # Also check age_years field directly
    if age_years is None and pet_data.get("age_years"):
        try:
            age_years = float(pet_data.get("age_years"))
        except (ValueError, TypeError):
            pass
    
    if age_years is not None:
        if age_years < 1:
            pet_tags.append("puppy")
        elif age_years < 2:
            pet_tags.append("puppy")
            pet_tags.append("adult")  # Transition period
        elif age_years >= 7:
            pet_tags.append("senior")
        else:
            pet_tags.append("adult")
    
    # 2. Health conditions and sensitivities
    doggy_soul = pet_data.get("doggy_soul_answers") or {}
    preferences = pet_data.get("preferences") or {}
    health_vault = pet_data.get("health_vault") or {}
    
    # Check for allergies/sensitivities
    allergies = (
        preferences.get("allergies") or 
        doggy_soul.get("food_allergies") or 
        health_vault.get("allergies") or 
        pet_data.get("sensitivities") or
        []
    )
    if allergies and allergies != "None":
        pet_tags.append("allergies")
    
    # Check for anxiety markers
    anxiety_indicators = [
        doggy_soul.get("noise_sensitivity"),
        doggy_soul.get("separation_anxiety"),
        doggy_soul.get("general_nature", "").lower() in ["anxious", "nervous", "shy"],
        "anxious" in str(doggy_soul.get("describe_3_words", "")).lower(),
        "nervous" in str(doggy_soul.get("describe_3_words", "")).lower(),
    ]
    if any(anxiety_indicators):
        pet_tags.append("anxious")
    
    # Check for health conditions
    health_conditions = doggy_soul.get("health_conditions") or []
    if isinstance(health_conditions, str):
        health_conditions = [h.strip() for h in health_conditions.split(",") if h.strip()]
    if health_conditions:
        pet_tags.append("health_issues")
    
    # 3. Activity level
    energy_level = doggy_soul.get("energy_level") or preferences.get("energy_level") or ""
    if "high" in str(energy_level).lower():
        pet_tags.append("high_energy")
    elif "low" in str(energy_level).lower():
        pet_tags.append("low_energy")
    
    # Always include "all" as fallback
    if not pet_tags:
        pet_tags = ["all"]
    pet_tags.append("all")  # All items with "all" tag are always included
    
    # ===== BREED TAGS =====
    breed = (pet_data.get("breed") or "").lower().strip()
    
    # Look up breed in mapping
    if breed in BREED_TAG_MAP:
        breed_tags = BREED_TAG_MAP[breed]
    else:
        # Try partial match
        for breed_key, tags in BREED_TAG_MAP.items():
            if breed_key in breed or breed in breed_key:
                breed_tags = tags
                break
    
    # If no breed match found, try to infer from breed name
    if not breed_tags:
        if any(term in breed for term in ["pug", "bulldog", "boxer", "shih"]):
            breed_tags.append("brachy")
        if any(term in breed for term in ["retriever", "husky", "shepherd", "spitz"]):
            breed_tags.append("double_coat")
        if any(term in breed for term in ["spaniel", "beagle", "hound", "dachshund"]):
            breed_tags.append("floppy_ears")
        if any(term in breed for term in ["terrier"]):
            breed_tags.append("terrier")
        if any(term in breed for term in ["poodle", "doodle"]):
            breed_tags.append("curly_coat")
    
    logger.info(f"[LEARN PERSONALIZATION] Pet: {pet_data.get('name', 'Unknown')}, Age: {age_years}, Pet Tags: {pet_tags}, Breed Tags: {breed_tags}")
    return list(set(pet_tags)), list(set(breed_tags))


def calculate_relevance_score(item: Dict, pet_tags: List[str], breed_tags: List[str]) -> int:
    """
    Calculate relevance score for a Learn item based on pet's tags.
    Higher score = more relevant to this specific pet.
    
    Scoring:
    - Pet tag match: +10 points each (e.g., puppy, senior, anxious)
    - Breed tag match: +5 points each (e.g., double_coat, brachy)
    - "all" tag: +1 point (baseline relevance)
    """
    score = 0
    item_pet_tags = item.get("pet_tags") or []
    item_breed_tags = item.get("breed_tags") or []
    
    # Pet tag matches (more important - "Pet First")
    for tag in pet_tags:
        if tag in item_pet_tags:
            score += 10 if tag != "all" else 1
    
    # Breed tag matches ("Breed Second")
    for tag in breed_tags:
        if tag in item_breed_tags:
            score += 5
    
    return score


async def fetch_pet_profile(db, pet_id: str) -> Optional[Dict]:
    """Fetch pet profile from database for personalization."""
    if not pet_id or pet_id in ["demo-pet", "demo"]:
        return None
    
    try:
        pet = await db.pets.find_one({"id": pet_id}, {"_id": 0})
        if not pet:
            # Try ObjectId match
            from bson import ObjectId
            if ObjectId.is_valid(pet_id):
                pet = await db.pets.find_one({"_id": ObjectId(pet_id)}, {"_id": 0})
        return pet
    except Exception as e:
        logger.warning(f"[LEARN] Could not fetch pet {pet_id}: {e}")
        return None


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


def enrich_item_for_frontend(
    item: Dict, 
    item_type: str, 
    is_saved: bool = False,
    relevance_score: int = 0,
    pet_name: str = None
) -> Dict:
    """Add display info to a Learn item, including personalization."""
    topic_str = item.get("topic", "health")
    try:
        topic_enum = LearnTopic(topic_str)
        topic_config = TOPIC_CONFIG.get(topic_enum, {})
    except (ValueError, KeyError):
        topic_config = {}
    
    enriched = {
        **item,
        "item_type": item_type,
        "is_saved": is_saved,
        "topic_label": topic_config.get("label", topic_str.title() if topic_str else "General"),
        "topic_icon": topic_config.get("icon", "book"),
        "topic_color": topic_config.get("color", "gray"),
        "time_display": f"{item.get('reading_time_sec', 90) // 60} min" if item_type == "guide" else f"{item.get('duration_sec', 180) // 60} min video",
        "relevance_score": relevance_score,
    }
    
    # Add personalization badge if highly relevant
    if relevance_score >= 10 and pet_name:
        enriched["relevance_badge"] = f"For {pet_name}"
        enriched["is_personalized"] = True
    elif relevance_score >= 5:
        enriched["is_personalized"] = True
    
    return enriched


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
