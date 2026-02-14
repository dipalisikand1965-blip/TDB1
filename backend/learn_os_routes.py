"""
LEARN OS Layer - API Routes
===========================
Curated library of tiny guides + wrapped YouTube videos.
Every item ends in: Do it myself | Let Mira do it | Ask Mira

GOLDEN DOCTRINE: Pet First, Breed Second
Every Learn item is personalized based on:
1. Pet's life stage (puppy, adult, senior)
2. Explicit sensitivities, routines, behaviour signals (no inference)
3. Breed-informed characteristics for grooming/travel/handling/comfort ONLY

SAFETY RULES:
- Only use explicit user-entered flags for anything health-adjacent
- Breed tags NEVER influence health content ranking
- No diagnosis, no certainty, no medical inference

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
from datetime import datetime, timezone, timedelta
from collections import Counter
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
    
    Extracts life stage, explicit sensitivities, routines, behaviour signals (no inference).
    Only uses explicit user-entered flags for anything health-adjacent.
    
    SAFETY RULES:
    - No medical inference
    - Only explicit user signals
    - Breed tags are for grooming/travel/handling/comfort ONLY
    
    Returns: (pet_tags, breed_tags)
    """
    pet_tags = []
    breed_tags = []
    
    if not pet_data:
        return ["all"], []
    
    # ===== PET TAGS (Life stage, explicit sensitivities, behaviour signals) =====
    
    # 1. Age-based tags (life stage)
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
    
    # 2. Explicit sensitivities (user-entered only, no inference)
    doggy_soul = pet_data.get("doggy_soul_answers") or {}
    preferences = pet_data.get("preferences") or {}
    
    # Check for explicitly flagged food sensitivities
    explicit_sensitivities = (
        preferences.get("allergies") or 
        doggy_soul.get("food_allergies") or 
        pet_data.get("sensitivities") or
        []
    )
    if explicit_sensitivities and explicit_sensitivities != "None":
        pet_tags.append("food_sensitive")
    
    # 3. Behaviour signals (explicitly entered by user)
    # Noise sensitivity - only if user explicitly flagged
    if doggy_soul.get("noise_sensitivity") is True:
        pet_tags.append("noise_sensitive")
    
    # Separation anxiety - only if user explicitly flagged
    if doggy_soul.get("separation_anxiety") is True:
        pet_tags.append("anxious")
    
    # General nature - only from explicit user description
    nature = str(doggy_soul.get("general_nature", "")).lower()
    if nature in ["anxious", "nervous", "shy"]:
        pet_tags.append("anxious")
    
    # 4. Routine signals (activity level)
    energy_level = doggy_soul.get("energy_level") or preferences.get("energy_level") or ""
    if "high" in str(energy_level).lower():
        pet_tags.append("high_energy")
    elif "low" in str(energy_level).lower():
        pet_tags.append("low_energy")
    
    # Always include "all" as fallback
    if not pet_tags:
        pet_tags = ["all"]
    pet_tags.append("all")  # All items with "all" tag are always included
    
    # ===== BREED TAGS (grooming/travel/handling/comfort ONLY) =====
    # SAFETY: These tags NEVER influence health content ranking
    breed = (pet_data.get("breed") or "").lower().strip()
    
    # Look up breed in mapping
    if breed in BREED_TAG_MAP:
        breed_tags = list(BREED_TAG_MAP[breed])  # Copy to avoid mutation
    else:
        # Try partial match
        for breed_key, tags in BREED_TAG_MAP.items():
            if breed_key in breed or breed in breed_key:
                breed_tags = list(tags)
                break
    
    # If no breed match found, try to infer coat/size characteristics
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
    
    logger.info(f"[LEARN] Pet: {pet_data.get('name', 'Unknown')}, Life stage tags: {[t for t in pet_tags if t in ['puppy','adult','senior']]}, Behaviour tags: {[t for t in pet_tags if t not in ['puppy','adult','senior','all']]}, Breed-informed tags: {breed_tags}")
    return list(set(pet_tags)), list(set(breed_tags))


# Topics where breed tags should NOT influence ranking (health-adjacent)
HEALTH_ADJACENT_TOPICS = {"health", "emergency", "medical", "vaccination", "vet"}

# Maximum contribution from breed tags (prevents breed-dominance)
MAX_BREED_TAG_SCORE = 10


def calculate_relevance_score(
    item: Dict, 
    pet_tags: List[str], 
    breed_tags: List[str],
    topic: str = None,
    user_feedback: Dict = None
) -> Tuple[int, str]:
    """
    Calculate relevance score for a Learn item based on pet's tags.
    Higher score = more relevant to this specific pet.
    
    SAFETY RULES:
    - If topic is health-adjacent, ignore breed_tags entirely
    - Cap breed tag contribution at MAX_BREED_TAG_SCORE
    - Apply negative weight if user marked "Not helpful"
    
    Scoring:
    - Pet tag match: +10 points each (e.g., puppy, senior, anxious)
    - Breed tag match: +5 points each, CAPPED at 10 total (grooming/travel/handling only)
    - "all" tag: +1 point (baseline relevance)
    - "Not helpful" feedback: -15 points
    
    Returns: (score, primary_matched_tag)
    """
    score = 0
    primary_tag = None
    item_pet_tags = item.get("pet_tags") or []
    item_breed_tags = item.get("breed_tags") or []
    item_topic = topic or item.get("topic", "").lower()
    
    # Pet tag matches (more important - "Pet First")
    for tag in pet_tags:
        if tag in item_pet_tags:
            if tag != "all":
                score += 10
                if primary_tag is None:
                    primary_tag = tag  # Track primary matched tag for diversity
            else:
                score += 1
    
    # Breed tag matches ("Breed Second") - with safety rules
    # SAFETY: If topic is health-adjacent, ignore breed tags entirely
    if item_topic not in HEALTH_ADJACENT_TOPICS:
        breed_score = 0
        for tag in breed_tags:
            if tag in item_breed_tags:
                breed_score += 5
        # Cap breed tag contribution
        score += min(breed_score, MAX_BREED_TAG_SCORE)
    
    # Apply negative weight for "Not helpful" feedback
    if user_feedback:
        item_id = item.get("id")
        if item_id and user_feedback.get(item_id) == "not_helpful":
            score -= 15
    
    return score, primary_tag


def apply_diversity_filter(items: List[Dict], max_per_tag: int = 2) -> List[Dict]:
    """
    Diversity rule: Don't show more than max_per_tag items with the same primary tag.
    Prevents "For your pet" from feeling like an echo chamber.
    """
    if not items:
        return items
    
    tag_counts = Counter()
    diverse_items = []
    
    for item in items:
        primary_tag = item.get("_primary_tag")
        
        # Always include items without a primary tag
        if not primary_tag:
            diverse_items.append(item)
            continue
        
        # Check if we've hit the limit for this tag
        if tag_counts[primary_tag] < max_per_tag:
            diverse_items.append(item)
            tag_counts[primary_tag] += 1
    
    return diverse_items


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


async def get_user_feedback(db, user_id: str, pet_id: str = None) -> Dict:
    """
    Get user's feedback on Learn items (helpful/not_helpful).
    
    SAFETY: Feedback is per user + per pet, not global.
    One user's "Not helpful" doesn't poison the library for everyone.
    """
    if not user_id:
        return {}
    
    try:
        # Build query - filter by user and optionally by pet
        query = {"user_id": user_id}
        if pet_id:
            query["pet_id"] = pet_id
        
        feedback_docs = await db.learn_feedback.find(
            query,
            {"item_id": 1, "feedback": 1, "_id": 0}
        ).to_list(200)
        return {doc["item_id"]: doc["feedback"] for doc in feedback_docs}
    except Exception as e:
        logger.warning(f"[LEARN] Could not fetch feedback for user {user_id}, pet {pet_id}: {e}")
        return {}


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
    pet_id: Optional[str] = Query(None, description="Pet ID for personalization"),
    authorization: Optional[str] = Header(None)
):
    """
    Get Learn home screen data with personalization.
    
    GOLDEN DOCTRINE: Pet First, Breed Second
    - If pet_id provided, creates a "For your pet" shelf with most relevant content
    - Ranks content based on pet's life stage, explicit sensitivities, behaviour signals
    - Breed tags only influence grooming/travel/handling content, NEVER health
    - Diversity filter prevents echo chamber (max 2 items per primary tag)
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
    
    # Get user feedback for user feedback penalty (per user + per pet)
    user_feedback = await get_user_feedback(db, user_id, pet_id) if user_id else {}
    
    # ===== PERSONALIZATION: Fetch pet profile =====
    pet_profile = None
    pet_tags = ["all"]
    breed_tags = []
    pet_name = None
    
    if pet_id:
        pet_profile = await fetch_pet_profile(db, pet_id)
        if pet_profile:
            pet_tags, breed_tags = derive_pet_tags_from_profile(pet_profile)
            pet_name = pet_profile.get("name")
            logger.info(f"[LEARN HOME] Personalizing for {pet_name}: pet_tags={pet_tags}, breed_tags={breed_tags}")
    
    # Get topics
    topics = []
    for topic_enum, config in TOPIC_CONFIG.items():
        topics.append({
            "id": topic_enum.value,
            "label": config["label"],
            "icon": config["icon"],
            "color": config["color"],
        })
    
    # Get all active content for personalization scoring
    all_guides = await db.learn_guides.find(
        {"is_active": True},
        {"_id": 0}
    ).to_list(100)
    
    all_videos = await db.learn_videos.find(
        {"is_active": True},
        {"_id": 0}
    ).to_list(50)
    
    # Score and sort content by relevance (with safety rules)
    scored_content = []
    for guide in all_guides:
        score, primary_tag = calculate_relevance_score(
            guide, pet_tags, breed_tags, 
            topic=guide.get("topic"),
            user_feedback=user_feedback
        )
        scored_content.append({
            "item": guide,
            "type": "guide",
            "score": score,
            "primary_tag": primary_tag,
            "is_featured": guide.get("is_featured", False)
        })
    
    for video in all_videos:
        score, primary_tag = calculate_relevance_score(
            video, pet_tags, breed_tags,
            topic=video.get("topic"),
            user_feedback=user_feedback
        )
        scored_content.append({
            "item": video,
            "type": "video",
            "score": score,
            "primary_tag": primary_tag,
            "is_featured": video.get("is_featured", False)
        })
    
    # Sort by relevance score (descending), then by sort_rank
    scored_content.sort(key=lambda x: (-x["score"], x["item"].get("sort_rank", 100)))
    
    # ===== BUILD SHELVES =====
    
    # "For your pet" shelf - Top personalized content (only if pet provided)
    for_your_pet = []
    if pet_profile:
        # Get items with score >= 5 (at least one meaningful tag match)
        personalized_candidates = [c for c in scored_content if c["score"] >= 5]
        
        # Apply diversity filter (max 2 items with same primary tag)
        for c in personalized_candidates:
            c["item"]["_primary_tag"] = c["primary_tag"]
        diverse_items = apply_diversity_filter(
            [c["item"] for c in personalized_candidates], 
            max_per_tag=2
        )
        
        # Enrich for frontend (limit to 8)
        for item in diverse_items[:8]:
            item_score = next((c["score"] for c in personalized_candidates if c["item"].get("id") == item.get("id")), 0)
            item_type = "video" if item.get("youtube_id") else "guide"
            enriched = enrich_item_for_frontend(
                item, 
                item_type, 
                item.get("id") in saved_ids,
                item_score,
                pet_name
            )
            # Clean up internal field
            enriched.pop("_primary_tag", None)
            for_your_pet.append(enriched)
    
    # "Start here" shelf - Featured content, also personalized
    start_here = []
    featured_items = [c for c in scored_content if c["is_featured"]]
    # Re-sort featured by relevance
    featured_items.sort(key=lambda x: (-x["score"], x["item"].get("sort_rank", 100)))
    
    for c in featured_items[:5]:
        start_here.append(enrich_item_for_frontend(
            c["item"],
            c["type"],
            c["item"].get("id") in saved_ids,
            c["score"],
            pet_name
        ))
    
    return {
        "success": True,
        "topics": topics,
        "for_your_pet": for_your_pet,  # NEW: Personalized shelf
        "start_here": start_here,
        "saved_count": len(saved_ids),
        "pet_name": pet_name,
        "personalization": {
            "enabled": pet_profile is not None,
            "pet_tags": pet_tags if pet_profile else [],
            "breed_tags": breed_tags if pet_profile else [],
        }
    }


@router.get("/topic/{topic}")
async def get_topic_content(
    topic: str,
    pet_id: Optional[str] = Query(None, description="Pet ID for personalization"),
    authorization: Optional[str] = Header(None)
):
    """
    Get content for a specific topic, organized into shelves.
    
    GOLDEN DOCTRINE: Pet First, Breed Second
    SAFETY RULES:
    - If topic is health-adjacent, breed tags are IGNORED
    - Diversity filter prevents echo chamber (max 2 items per primary tag)
    - Only explicit user signals influence health content ranking
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
    
    # Get user feedback for user feedback penalty (per user + per pet)
    user_feedback = await get_user_feedback(db, user_id, pet_id) if user_id else {}
    
    # Validate topic
    topic_lower = topic.lower()
    try:
        topic_enum = LearnTopic(topic_lower)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid topic: {topic}")
    
    topic_config = TOPIC_CONFIG.get(topic_enum, {})
    
    # ===== PERSONALIZATION =====
    pet_profile = None
    pet_tags = ["all"]
    breed_tags = []
    pet_name = None
    
    if pet_id:
        pet_profile = await fetch_pet_profile(db, pet_id)
        if pet_profile:
            pet_tags, breed_tags = derive_pet_tags_from_profile(pet_profile)
            pet_name = pet_profile.get("name")
    
    # Fetch guides for this topic (active only)
    guides = await db.learn_guides.find(
        {"topic": topic_lower, "is_active": True},
        {"_id": 0}
    ).to_list(50)
    
    # Fetch videos for this topic (active only)
    videos = await db.learn_videos.find(
        {"topic": topic_lower, "is_active": True},
        {"_id": 0}
    ).to_list(30)
    
    # Score all content (with topic-aware safety rules)
    scored_guides = []
    for guide in guides:
        score, primary_tag = calculate_relevance_score(
            guide, pet_tags, breed_tags,
            topic=topic_lower,
            user_feedback=user_feedback
        )
        scored_guides.append({"item": guide, "score": score, "primary_tag": primary_tag})
    
    scored_videos = []
    for video in videos:
        score, primary_tag = calculate_relevance_score(
            video, pet_tags, breed_tags,
            topic=topic_lower,
            user_feedback=user_feedback
        )
        scored_videos.append({"item": video, "score": score, "primary_tag": primary_tag})
    
    # Sort by relevance then sort_rank
    scored_guides.sort(key=lambda x: (-x["score"], x["item"].get("sort_rank", 100)))
    scored_videos.sort(key=lambda x: (-x["score"], x["item"].get("sort_rank", 100)))
    
    # Build shelves
    for_your_pet = []
    start_here = []
    two_min_guides = []
    watch_learn = []
    
    # "For your pet" - Highly relevant items from this topic (with diversity filter)
    if pet_profile:
        personalized_candidates = []
        for g in scored_guides:
            if g["score"] >= 5:
                g["item"]["_primary_tag"] = g["primary_tag"]
                personalized_candidates.append({"item": g["item"], "score": g["score"], "type": "guide"})
        for v in scored_videos:
            if v["score"] >= 5:
                v["item"]["_primary_tag"] = v["primary_tag"]
                personalized_candidates.append({"item": v["item"], "score": v["score"], "type": "video"})
        
        # Sort by score
        personalized_candidates.sort(key=lambda x: -x["score"])
        
        # Apply diversity filter
        diverse_items = apply_diversity_filter(
            [c["item"] for c in personalized_candidates],
            max_per_tag=2
        )
        
        # Enrich for frontend (limit to 5)
        for item in diverse_items[:5]:
            item_score = next((c["score"] for c in personalized_candidates if c["item"].get("id") == item.get("id")), 0)
            item_type = "video" if item.get("youtube_id") else "guide"
            enriched = enrich_item_for_frontend(
                item, item_type, item.get("id") in saved_ids, item_score, pet_name
            )
            enriched.pop("_primary_tag", None)
            for_your_pet.append(enriched)
    
    # Start here (featured), guides, videos
    for g in scored_guides:
        guide = g["item"]
        guide.pop("_primary_tag", None)  # Clean up
        enriched = enrich_item_for_frontend(
            guide, "guide", guide.get("id") in saved_ids, g["score"], pet_name
        )
        if guide.get("is_featured"):
            start_here.append(enriched)
        else:
            two_min_guides.append(enriched)
    
    for v in scored_videos:
        video = v["item"]
        video.pop("_primary_tag", None)  # Clean up
        enriched = enrich_item_for_frontend(
            video, "video", video.get("id") in saved_ids, v["score"], pet_name
        )
        if video.get("is_featured"):
            start_here.append(enriched)
        else:
            watch_learn.append(enriched)
    
    # Sort start_here by score then sort_rank
    start_here.sort(key=lambda x: (-x.get("relevance_score", 0), x.get("sort_rank", 100)))
    
    return {
        "success": True,
        "topic": {
            "id": topic_lower,
            "label": topic_config.get("label", topic.title()),
            "icon": topic_config.get("icon", "book"),
            "color": topic_config.get("color", "gray"),
        },
        "shelves": {
            "for_your_pet": for_your_pet if for_your_pet else None,
            "start_here": start_here[:3],
            "guides": two_min_guides,
            "videos": watch_learn
        },
        "counts": {
            "for_your_pet": len(for_your_pet) if for_your_pet else 0,
            "start_here": min(len(start_here), 3),
            "guides": len(two_min_guides),
            "videos": len(watch_learn)
        },
        "pet_name": pet_name,
        "personalization": {
            "enabled": pet_profile is not None,
            "breed_tags_applied": topic_lower not in HEALTH_ADJACENT_TOPICS,
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



# ============================================
# LEARN → TODAY INTEGRATION
# ============================================
# 
# Event Types: saved, completed, helpful, not_helpful
# Collections:
#   - learn_events: {user_id, pet_id, item_id, event_type, ts}
#   - today_nudge_log: {user_id, pet_id, nudge_type, item_id, shown_at, dismissed_at}
#
# Anti-Spam Rules:
#   1. Learn-nudge only if user completed/saved a Learn item
#   2. The Learn item has a mapped next action (service_cta or ask_mira_suggestion)
#   3. No other Learn-nudge shown in last 7 days for that pet
#   4. Same Learn item hasn't nudged within 30 days
#   5. Today already has < 1 other "soft" nudges on screen
# ============================================


@router.post("/event")
async def record_learn_event(
    item_id: str = Query(..., description="Learn item ID"),
    item_type: str = Query(..., description="guide or video"),
    event_type: str = Query(..., description="saved|completed|helpful|not_helpful"),
    pet_id: Optional[str] = Query(None, description="Pet ID for context"),
    authorization: Optional[str] = Header(None)
):
    """
    Record a user event on a Learn item.
    
    Events feed:
    - LEARN → TODAY nudges (completed/saved → smart nudge within 7 days)
    - User feedback scoring (helpful/not_helpful → relevance adjustment)
    - Soul growth (explicit signals only)
    
    Event Types:
    - saved: User saved the item to favorites
    - completed: User finished reading/watching (>50% for videos)
    - helpful: User marked as helpful
    - not_helpful: User marked as not helpful
    """
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    
    user = await get_user_from_token(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    user_id = user.get("user_id")
    
    # Validate event type
    valid_events = ["saved", "completed", "helpful", "not_helpful"]
    if event_type not in valid_events:
        raise HTTPException(status_code=400, detail=f"Invalid event_type. Use one of: {valid_events}")
    
    # Store the event
    event = {
        "user_id": user_id,
        "pet_id": pet_id,
        "item_id": item_id,
        "item_type": item_type,
        "event_type": event_type,
        "ts": datetime.now(timezone.utc)
    }
    
    await db.learn_events.insert_one(event)
    logger.info(f"[LEARN EVENT] {event_type} for {item_id} by user {user_id}, pet {pet_id}")
    
    # If not_helpful or helpful, also update the feedback collection for scoring
    if event_type in ["helpful", "not_helpful"]:
        await db.learn_feedback.update_one(
            {"user_id": user_id, "pet_id": pet_id, "item_id": item_id},
            {
                "$set": {
                    "feedback": event_type,
                    "updated_at": datetime.now(timezone.utc)
                }
            },
            upsert=True
        )
    
    return {
        "success": True,
        "event_type": event_type,
        "item_id": item_id
    }


# CTA mappings from Learn items → Service types
# This determines what nudge action to show in TODAY
LEARN_TO_SERVICE_MAP = {
    # Grooming guides
    "guide_brushing_coats": {"service_type": "grooming", "action_label": "Book grooming session"},
    "guide_first_grooming": {"service_type": "grooming", "action_label": "Book first grooming"},
    "guide_ear_cleaning": {"service_type": "grooming", "action_label": "Book ear cleaning"},
    "guide_nail_trim": {"service_type": "grooming", "action_label": "Book nail trim"},
    
    # Behaviour guides
    "guide_fireworks_anxiety": {"service_type": "calming_kit", "action_label": "Arrange calming kit"},
    "guide_separation_anxiety": {"service_type": "trainer_consult", "action_label": "Book trainer consult"},
    "guide_leash_training": {"service_type": "training", "action_label": "Book training session"},
    
    # Health guides
    "guide_tick_protocol": {"service_type": "parasite_prevention", "action_label": "Order prevention"},
    "guide_vaccination_basics": {"service_type": "vet_checkup", "action_label": "Schedule vaccination"},
    "guide_emergency_signs": {"service_type": "vet_checkup", "action_label": "Book vet visit"},
    
    # Travel/Boarding guides
    "guide_boarding_checklist": {"service_type": "boarding", "action_label": "Find boarding"},
    "guide_travel_prep": {"service_type": "travel_kit", "action_label": "Get travel kit"},
    
    # Food guides
    "guide_puppy_feeding": {"service_type": "food_consultation", "action_label": "Get food advice"},
    "guide_food_transition": {"service_type": "food_delivery", "action_label": "Order food"},
    
    # Videos also map to services
    "video_brushing_demo": {"service_type": "grooming", "action_label": "Book grooming"},
    "video_leash_manners": {"service_type": "training", "action_label": "Book training"},
    "video_fireworks_calm": {"service_type": "calming_kit", "action_label": "Arrange calming kit"},
}


@router.get("/today-nudge")
async def get_learn_nudge_for_today(
    pet_id: str = Query(..., description="Pet ID"),
    authorization: Optional[str] = Header(None)
):
    """
    Get a single Learn-based nudge for the TODAY panel.
    
    Anti-Spam Rules (all must be true):
    1. User completed or saved a Learn item
    2. The Learn item has a mapped next action (service_cta)
    3. No other Learn-nudge shown in last 7 days for that pet
    4. Same Learn item hasn't nudged within 30 days
    5. Today already has < 1 other "soft" nudges on screen (checked by caller)
    
    Returns:
    - null if no nudge eligible
    - One LearnNudge object if eligible
    """
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    
    user = await get_user_from_token(authorization)
    if not user:
        return {"success": True, "nudge": None, "reason": "no_auth"}
    
    user_id = user.get("user_id")
    
    if not pet_id or pet_id in ["demo-pet", "demo"]:
        return {"success": True, "nudge": None, "reason": "no_pet"}
    
    now = datetime.now(timezone.utc)
    seven_days_ago = now - timedelta(days=7)
    thirty_days_ago = now - timedelta(days=30)
    
    # Rule 3: Check if ANY Learn-nudge was shown in last 7 days for this pet
    recent_nudge = await db.today_nudge_log.find_one({
        "user_id": user_id,
        "pet_id": pet_id,
        "nudge_type": "learn",
        "shown_at": {"$gte": seven_days_ago}
    })
    
    if recent_nudge:
        logger.info(f"[LEARN NUDGE] Skipped: Already showed nudge in last 7 days for pet {pet_id}")
        return {"success": True, "nudge": None, "reason": "cooldown_active"}
    
    # Rule 1: Get completed/saved events from last 7 days
    eligible_events = await db.learn_events.find({
        "user_id": user_id,
        "pet_id": pet_id,
        "event_type": {"$in": ["completed", "saved"]},
        "ts": {"$gte": seven_days_ago}
    }).sort("ts", -1).to_list(20)
    
    if not eligible_events:
        logger.info(f"[LEARN NUDGE] Skipped: No completed/saved events in last 7 days for pet {pet_id}")
        return {"success": True, "nudge": None, "reason": "no_recent_activity"}
    
    # Rule 2 & 4: Find an item that has a service mapping AND hasn't nudged in 30 days
    for event in eligible_events:
        item_id = event.get("item_id")
        item_type = event.get("item_type", "guide")
        
        # Check if this item has a service mapping
        service_mapping = LEARN_TO_SERVICE_MAP.get(item_id)
        if not service_mapping:
            continue
        
        # Rule 4: Check if this specific item nudged in last 30 days
        item_nudged_recently = await db.today_nudge_log.find_one({
            "user_id": user_id,
            "pet_id": pet_id,
            "nudge_type": "learn",
            "item_id": item_id,
            "shown_at": {"$gte": thirty_days_ago}
        })
        
        if item_nudged_recently:
            continue  # Try next item
        
        # Fetch the Learn item details
        collection = db.learn_guides if item_type == "guide" else db.learn_videos
        item = await collection.find_one({"id": item_id}, {"_id": 0})
        
        if not item:
            continue
        
        # Get pet name for context
        pet = await db.pets.find_one({"id": pet_id}, {"name": 1, "_id": 0})
        pet_name = pet.get("name", "your pet") if pet else "your pet"
        
        # Build the nudge
        nudge = {
            "id": f"learn_nudge_{item_id}_{int(now.timestamp())}",
            "type": "learn_nudge",
            "title": "Want me to handle this?",
            "context_line": f"Since you completed {item.get('title')}...",
            "learn_item": {
                "id": item_id,
                "type": item_type,
                "title": item.get("title"),
                "topic": item.get("topic")
            },
            "primary_cta": {
                "label": service_mapping.get("action_label", "Let Mira do it"),
                "service_type": service_mapping.get("service_type"),
                "prefill": {
                    "source_layer": "learn",
                    "source_item_id": item_id,
                    "source_item_title": item.get("title"),
                    "pet_id": pet_id
                }
            },
            "secondary_cta": {
                "label": "Ask Mira",
                "action": "open_concierge",
                "context": {
                    "source": "today_learn_nudge",
                    "learn_item": {"id": item_id, "title": item.get("title")},
                    "initialMessage": f"I've completed \"{item.get('title')}\". Can you help me with next steps for {pet_name}?"
                }
            },
            "dismiss_action": "not_now",  # "Not now" → don't show again for 7 days
            "pet_id": pet_id,
            "pet_name": pet_name,
            "event_ts": event.get("ts").isoformat() if event.get("ts") else None
        }
        
        # Log that we're showing this nudge (pre-emptively)
        await db.today_nudge_log.insert_one({
            "user_id": user_id,
            "pet_id": pet_id,
            "nudge_type": "learn",
            "item_id": item_id,
            "shown_at": now,
            "dismissed_at": None
        })
        
        logger.info(f"[LEARN NUDGE] Showing nudge for item {item_id} to pet {pet_id}")
        return {"success": True, "nudge": nudge}
    
    # No eligible items found
    return {"success": True, "nudge": None, "reason": "no_actionable_items"}


@router.post("/today-nudge/dismiss")
async def dismiss_learn_nudge(
    nudge_id: str = Query(..., description="Nudge ID to dismiss"),
    item_id: str = Query(..., description="Learn item ID"),
    pet_id: str = Query(..., description="Pet ID"),
    authorization: Optional[str] = Header(None)
):
    """
    Dismiss a Learn nudge from TODAY.
    "Not now" → don't show this item again for 7 days (already logged when shown).
    Updates the dismissed_at timestamp.
    """
    db = get_db()
    if db is None:
        raise HTTPException(status_code=503, detail="Database unavailable")
    
    user = await get_user_from_token(authorization)
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    user_id = user.get("user_id")
    
    # Update the nudge log with dismissal timestamp
    result = await db.today_nudge_log.update_one(
        {
            "user_id": user_id,
            "pet_id": pet_id,
            "item_id": item_id,
            "nudge_type": "learn"
        },
        {"$set": {"dismissed_at": datetime.now(timezone.utc)}}
    )
    
    logger.info(f"[LEARN NUDGE] Dismissed nudge for item {item_id}, pet {pet_id}")
    
    return {
        "success": True,
        "dismissed": result.modified_count > 0
    }


# ============================================
# TODAY → LEARN DEEP LINKS
# ============================================
# 
# Mapping from Today alert types to relevant Learn items
# Used by TodayPanel to add "2-minute guide" links
# ============================================

TODAY_TO_LEARN_MAP = {
    # Seasonal alerts → Learn guides
    "tick_season": {
        "item_type": "guide",
        "item_id": "guide_tick_protocol",
        "link_text": "2-minute guide"
    },
    "fireworks_prep": {
        "item_type": "guide",
        "item_id": "guide_fireworks_anxiety",
        "link_text": "Prep routine"
    },
    "heat_advisory": {
        "item_type": "guide",
        "item_id": "guide_summer_safety",
        "link_text": "Safety tips"
    },
    "cold_warning": {
        "item_type": "guide",
        "item_id": "guide_winter_care",
        "link_text": "Winter tips"
    },
    
    # Due soon alerts → Prep guides
    "vacc_due": {
        "item_type": "guide",
        "item_id": "guide_vaccination_basics",
        "link_text": "What to expect"
    },
    "groom_due": {
        "item_type": "guide",
        "item_id": "guide_first_grooming",
        "link_text": "How to prep"
    },
    "checkup_due": {
        "item_type": "guide",
        "item_id": "guide_vet_visit_prep",
        "link_text": "Prep checklist"
    },
    "parasite_due": {
        "item_type": "guide",
        "item_id": "guide_tick_protocol",
        "link_text": "Prevention guide"
    },
    
    # Urgent alerts → What to do now (only non-medical)
    "groom_overdue": {
        "item_type": "guide",
        "item_id": "guide_brushing_coats",
        "link_text": "DIY brushing"
    },
}


@router.get("/deep-link-map")
async def get_today_learn_deep_links():
    """
    Get the mapping of Today alert types to Learn items.
    Used by TodayPanel to render deep-link buttons.
    
    Deep link format: /os?tab=learn&open={type}:{id}&pet_id={pet_id}&src=today:{today_card_id}
    """
    # Enrich with full item details
    db = get_db()
    enriched_map = {}
    
    for alert_type, mapping in TODAY_TO_LEARN_MAP.items():
        item_id = mapping.get("item_id")
        item_type = mapping.get("item_type", "guide")
        
        # Try to get item title from DB
        if db is not None:
            collection = db.learn_guides if item_type == "guide" else db.learn_videos
            item = await collection.find_one({"id": item_id}, {"title": 1, "_id": 0})
            title = item.get("title") if item else None
        else:
            title = None
        
        enriched_map[alert_type] = {
            **mapping,
            "title": title,
            "deep_link_template": f"/os?tab=learn&open={item_type}:{item_id}&pet_id={{pet_id}}&src=today:{alert_type}"
        }
    
    return {
        "success": True,
        "map": enriched_map
    }
