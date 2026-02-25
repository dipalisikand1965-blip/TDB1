"""
YouTube API Service
Provides training videos for pets based on breed, age, stage, and topics
"""

import httpx
import logging
from typing import Optional, Dict, List, Any
import os

logger = logging.getLogger(__name__)

# YouTube API Configuration
YOUTUBE_API_KEY = os.environ.get("YOUTUBE_API_KEY", "")
YOUTUBE_API_URL = "https://www.googleapis.com/youtube/v3"

# Trusted pet training channels
TRUSTED_CHANNELS = [
    "Zak George's Dog Training Revolution",
    "Kikopup",
    "McCann Dog Training",
    "Simpawtico Dog Training",
    "Victoria Stilwell",
    "The Dog Daddy",
    "Cesar Millan",
    "Training Positive"
]

# Video categories by pet life stage
LIFE_STAGE_TOPICS = {
    "puppy": {
        "age_range": "0-1 years",
        "topics": ["puppy training basics", "potty training", "crate training", "puppy socialization", 
                   "bite inhibition", "puppy commands", "leash training puppy"]
    },
    "adolescent": {
        "age_range": "1-2 years",
        "topics": ["adolescent dog training", "recall training", "impulse control", 
                   "advanced obedience", "dog reactivity training"]
    },
    "adult": {
        "age_range": "2-7 years",
        "topics": ["adult dog training", "trick training", "agility training",
                   "behavior modification", "advanced tricks"]
    },
    "senior": {
        "age_range": "7+ years",
        "topics": ["senior dog care", "senior dog exercises", "joint care dogs",
                   "mental stimulation senior dogs", "gentle training older dogs"]
    }
}

# Breed-specific training topics
BREED_TRAINING_TOPICS = {
    "golden retriever": ["retriever training", "golden retriever puppies", "retriever recall", "swimming dog training"],
    "labrador": ["labrador training", "lab puppy training", "retriever obedience"],
    "german shepherd": ["german shepherd training", "GSD obedience", "protection dog training basics"],
    "beagle": ["beagle training", "scent hound training", "beagle recall"],
    "bulldog": ["bulldog training", "low energy dog training", "brachycephalic dog care"],
    "poodle": ["poodle training", "intelligent dog training", "poodle grooming"],
    "rottweiler": ["rottweiler training", "large breed training", "rottweiler obedience"],
    "husky": ["husky training", "high energy dog training", "husky recall"],
    "boxer": ["boxer training", "playful dog training"],
    "dachshund": ["dachshund training", "small dog training", "dachshund recall"],
    "shih tzu": ["shih tzu training", "small dog obedience"],
    "pomeranian": ["pomeranian training", "toy breed training"],
    "indie": ["indian pariah dog training", "desi dog training", "street dog training"],
    "mixed breed": ["mixed breed dog training", "rescue dog training"]
}


async def search_youtube_videos(
    query: str,
    max_results: int = 5,
    order: str = "relevance"  # relevance, date, rating, viewCount
) -> List[Dict[str, Any]]:
    """
    Search YouTube for videos matching the query.
    
    Args:
        query: Search query string
        max_results: Maximum number of results
        order: Sort order
        
    Returns:
        List of video dictionaries
    """
    if not YOUTUBE_API_KEY:
        logger.warning("YouTube API key not configured")
        return []
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{YOUTUBE_API_URL}/search",
                params={
                    "part": "snippet",
                    "q": query,
                    "type": "video",
                    "maxResults": max_results,
                    "order": order,
                    "key": YOUTUBE_API_KEY,
                    "videoEmbeddable": "true",
                    "safeSearch": "strict"
                },
                timeout=10.0
            )
            
            if response.status_code != 200:
                logger.error(f"YouTube API error: {response.status_code} - {response.text}")
                return []
            
            data = response.json()
            return _process_youtube_response(data)
            
    except Exception as e:
        logger.error(f"YouTube search error: {e}")
        return []


def _process_youtube_response(data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Process YouTube API response into standardized format."""
    videos = []
    
    for item in data.get("items", []):
        snippet = item.get("snippet", {})
        video_id = item.get("id", {}).get("videoId", "")
        
        if not video_id:
            continue
        
        videos.append({
            "id": video_id,
            "title": snippet.get("title", ""),
            "description": snippet.get("description", "")[:200] + "..." if len(snippet.get("description", "")) > 200 else snippet.get("description", ""),
            "thumbnail": snippet.get("thumbnails", {}).get("medium", {}).get("url") or snippet.get("thumbnails", {}).get("default", {}).get("url"),
            "channel": snippet.get("channelTitle", ""),
            "published_at": snippet.get("publishedAt", ""),
            "url": f"https://www.youtube.com/watch?v={video_id}",
            "embed_url": f"https://www.youtube.com/embed/{video_id}",
            "source": "youtube"
        })
    
    return videos


async def get_training_videos_by_breed(breed: str, max_results: int = 5) -> Dict[str, Any]:
    """
    Get training videos specific to a breed.
    
    Args:
        breed: Dog breed name
        max_results: Maximum videos to return
        
    Returns:
        Dictionary with videos and metadata
    """
    breed_lower = breed.lower()
    
    # Find breed-specific topics
    topics = []
    for key, value in BREED_TRAINING_TOPICS.items():
        if key in breed_lower or breed_lower in key:
            topics = value
            break
    
    if not topics:
        topics = ["dog training basics", f"{breed} training"]
    
    # Search for the first topic
    query = f"{topics[0]} dog training"
    videos = await search_youtube_videos(query, max_results)
    
    return {
        "success": True,
        "breed": breed,
        "query": query,
        "videos": videos,
        "total": len(videos),
        "related_topics": topics
    }


async def get_training_videos_by_age(age_years: float, breed: str = None, max_results: int = 5) -> Dict[str, Any]:
    """
    Get training videos appropriate for the pet's age/life stage.
    
    Args:
        age_years: Pet's age in years
        breed: Optional breed for more specific results
        max_results: Maximum videos to return
        
    Returns:
        Dictionary with videos and metadata
    """
    # Determine life stage
    if age_years < 1:
        stage = "puppy"
    elif age_years < 2:
        stage = "adolescent"
    elif age_years < 7:
        stage = "adult"
    else:
        stage = "senior"
    
    stage_info = LIFE_STAGE_TOPICS.get(stage, LIFE_STAGE_TOPICS["adult"])
    topics = stage_info["topics"]
    
    # Add breed context if provided
    query = topics[0]
    if breed:
        query = f"{breed} {query}"
    
    videos = await search_youtube_videos(query, max_results)
    
    return {
        "success": True,
        "age_years": age_years,
        "life_stage": stage,
        "age_range": stage_info["age_range"],
        "query": query,
        "videos": videos,
        "total": len(videos),
        "suggested_topics": topics
    }


async def get_training_videos_by_topic(
    topic: str, 
    breed: str = None, 
    age_years: float = None,
    max_results: int = 5
) -> Dict[str, Any]:
    """
    Get training videos for a specific topic.
    
    Args:
        topic: Training topic (e.g., "potty training", "recall", "anxiety")
        breed: Optional breed for context
        age_years: Optional age for context
        max_results: Maximum videos
        
    Returns:
        Dictionary with videos
    """
    # Build query with context
    query_parts = [topic, "dog training"]
    
    if breed:
        query_parts.insert(0, breed)
    
    if age_years is not None:
        if age_years < 1:
            query_parts.append("puppy")
        elif age_years >= 7:
            query_parts.append("senior")
    
    query = " ".join(query_parts)
    videos = await search_youtube_videos(query, max_results)
    
    return {
        "success": True,
        "topic": topic,
        "breed": breed,
        "query": query,
        "videos": videos,
        "total": len(videos)
    }


async def get_recommended_videos_for_pet(
    pet_name: str,
    breed: str,
    age_years: float,
    sensitivities: List[str] = None,
    max_results: int = 6
) -> Dict[str, Any]:
    """
    Get personalized video recommendations for a specific pet.
    
    Args:
        pet_name: Pet's name
        breed: Pet's breed
        age_years: Pet's age in years
        sensitivities: List of sensitivities/issues (e.g., ["anxiety", "allergies"])
        max_results: Maximum videos to return
        
    Returns:
        Personalized video recommendations
    """
    all_videos = []
    categories = []
    
    # 1. Get breed-specific videos (2 videos)
    breed_result = await get_training_videos_by_breed(breed, max_results=2)
    if breed_result.get("videos"):
        all_videos.extend(breed_result["videos"])
        categories.append({"name": f"{breed} Training", "count": len(breed_result["videos"])})
    
    # 2. Get age-appropriate videos (2 videos)
    age_result = await get_training_videos_by_age(age_years, breed, max_results=2)
    if age_result.get("videos"):
        # Avoid duplicates
        existing_ids = {v["id"] for v in all_videos}
        new_videos = [v for v in age_result["videos"] if v["id"] not in existing_ids]
        all_videos.extend(new_videos)
        categories.append({"name": f"{age_result['life_stage'].title()} Stage", "count": len(new_videos)})
    
    # 3. Get sensitivity-specific videos if provided (2 videos)
    if sensitivities:
        for sensitivity in sensitivities[:2]:  # Max 2 sensitivities
            sens_result = await get_training_videos_by_topic(sensitivity, breed, age_years, max_results=1)
            if sens_result.get("videos"):
                existing_ids = {v["id"] for v in all_videos}
                new_videos = [v for v in sens_result["videos"] if v["id"] not in existing_ids]
                all_videos.extend(new_videos)
                categories.append({"name": f"{sensitivity.title()} Help", "count": len(new_videos)})
    
    return {
        "success": True,
        "pet_name": pet_name,
        "breed": breed,
        "age_years": age_years,
        "life_stage": age_result.get("life_stage", "adult"),
        "videos": all_videos[:max_results],
        "total": len(all_videos[:max_results]),
        "categories": categories,
        "message": f"Personalized training videos for {pet_name}"
    }


# Test function
async def test_youtube_connection():
    """Test if YouTube API is working."""
    if not YOUTUBE_API_KEY:
        return {"success": False, "error": "API key not configured"}
    
    try:
        result = await search_youtube_videos("puppy training basics", max_results=2)
        return {
            "success": len(result) > 0,
            "results_count": len(result),
            "sample": result[0] if result else None
        }
    except Exception as e:
        return {"success": False, "error": str(e)}
