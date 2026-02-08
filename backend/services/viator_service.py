"""
Viator API Service
Provides pet-friendly attractions, tours, and experiences
"""

import httpx
import logging
from typing import Optional, Dict, List, Any
import os
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

# Viator API Configuration
VIATOR_API_KEY = os.environ.get("VIATOR_API_KEY", "")
VIATOR_API_URL = "https://api.viator.com/partner"  # Partner API base URL

# Pet-friendly search terms
PET_FRIENDLY_KEYWORDS = [
    "pet friendly",
    "dog friendly", 
    "pets allowed",
    "animal",
    "wildlife",
    "nature",
    "outdoor",
    "park",
    "beach",
    "hiking"
]

# Destination codes for Indian cities
INDIA_DESTINATIONS = {
    "mumbai": {"id": "684", "name": "Mumbai"},
    "delhi": {"id": "804", "name": "Delhi"},
    "bangalore": {"id": "4440", "name": "Bangalore"},
    "bengaluru": {"id": "4440", "name": "Bangalore"},
    "chennai": {"id": "4464", "name": "Chennai"},
    "kolkata": {"id": "4485", "name": "Kolkata"},
    "hyderabad": {"id": "4478", "name": "Hyderabad"},
    "jaipur": {"id": "4479", "name": "Jaipur"},
    "goa": {"id": "4467", "name": "Goa"},
    "udaipur": {"id": "28463", "name": "Udaipur"},
    "agra": {"id": "4433", "name": "Agra"},
    "varanasi": {"id": "50628", "name": "Varanasi"},
    "kochi": {"id": "4484", "name": "Kochi"},
    "shimla": {"id": "28615", "name": "Shimla"},
    "manali": {"id": "28507", "name": "Manali"},
    "rishikesh": {"id": "28587", "name": "Rishikesh"},
    "ooty": {"id": "28549", "name": "Ooty"},
    "munnar": {"id": "28527", "name": "Munnar"},
}


async def search_attractions(
    destination: str,
    query: str = None,
    pet_friendly: bool = True,
    limit: int = 10,
    sort_by: str = "REVIEW_AVG_RATING"
) -> List[Dict[str, Any]]:
    """
    Search for attractions and experiences in a destination.
    
    Args:
        destination: City name
        query: Search query
        pet_friendly: Filter for pet-friendly options
        limit: Maximum results
        sort_by: Sort order (REVIEW_AVG_RATING, PRICE, DEFAULT)
        
    Returns:
        List of attraction dictionaries
    """
    if not VIATOR_API_KEY:
        logger.warning("Viator API key not configured")
        return []
    
    # Get destination ID
    dest_lower = destination.lower().strip()
    dest_info = INDIA_DESTINATIONS.get(dest_lower)
    
    if not dest_info:
        logger.warning(f"Destination not found: {destination}")
        return []
    
    # Build search query
    search_query = query or ""
    if pet_friendly:
        search_query = f"{search_query} outdoor nature" if search_query else "outdoor nature park"
    
    try:
        headers = {
            "exp-api-key": VIATOR_API_KEY,
            "Accept": "application/json;version=2.0",
            "Accept-Language": "en-US",
            "Content-Type": "application/json"
        }
        
        # Use freetext search endpoint
        payload = {
            "searchTerm": search_query,
            "searchTypes": ["PRODUCTS"],
            "currency": "INR",
            "filtering": {
                "destination": dest_info["id"]
            },
            "pagination": {
                "start": 1,
                "count": limit
            },
            "sorting": {
                "sort": sort_by,
                "order": "DESC" if sort_by == "REVIEW_AVG_RATING" else "ASC"
            }
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{VIATOR_API_URL}/search/freetext",
                headers=headers,
                json=payload,
                timeout=15.0
            )
            
            if response.status_code != 200:
                logger.error(f"Viator API error: {response.status_code} - {response.text}")
                # Try alternative endpoint
                return await _search_products_alternative(dest_info, search_query, limit)
            
            data = response.json()
            products = data.get("products", {}).get("results", [])
            return _process_viator_response(products, destination)
            
    except Exception as e:
        logger.error(f"Viator search error: {e}")
        return []


async def _search_products_alternative(dest_info: Dict, query: str, limit: int) -> List[Dict[str, Any]]:
    """Alternative search using products endpoint."""
    try:
        headers = {
            "exp-api-key": VIATOR_API_KEY,
            "Accept": "application/json;version=2.0",
            "Content-Type": "application/json"
        }
        
        payload = {
            "filtering": {
                "destination": dest_info["id"]
            },
            "pagination": {
                "start": 1,
                "count": limit
            },
            "sorting": {
                "sort": "REVIEW_AVG_RATING",
                "order": "DESC"
            },
            "currency": "INR"
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{VIATOR_API_URL}/products/search",
                headers=headers,
                json=payload,
                timeout=15.0
            )
            
            if response.status_code == 200:
                data = response.json()
                products = data.get("products", [])
                return _process_viator_response(products, dest_info["name"])
            
            return []
            
    except Exception as e:
        logger.error(f"Viator alternative search error: {e}")
        return []


def _process_viator_response(products: List[Dict], destination: str) -> List[Dict[str, Any]]:
    """Process Viator API response into standardized format."""
    attractions = []
    
    for product in products:
        # Get image URL
        images = product.get("images", [])
        image_url = None
        if images:
            # Get medium size image
            variants = images[0].get("variants", [])
            for variant in variants:
                if variant.get("width", 0) >= 300:
                    image_url = variant.get("url")
                    break
            if not image_url and variants:
                image_url = variants[0].get("url")
        
        # Get pricing
        pricing = product.get("pricing", {})
        price_from = pricing.get("summary", {}).get("fromPrice")
        currency = pricing.get("currency", "INR")
        
        # Get reviews
        reviews = product.get("reviews", {})
        rating = reviews.get("combinedAverageRating")
        review_count = reviews.get("totalReviews", 0)
        
        # Get duration
        duration = product.get("duration", {})
        duration_text = duration.get("fixedDurationInMinutes")
        if duration_text:
            hours = duration_text // 60
            mins = duration_text % 60
            duration_text = f"{hours}h {mins}m" if hours else f"{mins} min"
        
        # Check if likely pet-friendly based on title/description
        title = product.get("title", "").lower()
        description = (product.get("description", "") or "").lower()
        is_pet_friendly = any(kw in title or kw in description for kw in ["pet", "dog", "outdoor", "park", "nature", "beach", "hiking"])
        
        attractions.append({
            "id": product.get("productCode"),
            "title": product.get("title"),
            "description": product.get("description", "")[:200] + "..." if len(product.get("description", "")) > 200 else product.get("description", ""),
            "image_url": image_url,
            "rating": rating,
            "review_count": review_count,
            "price_from": price_from,
            "currency": currency,
            "duration": duration_text,
            "destination": destination,
            "booking_url": f"https://www.viator.com/tours/{product.get('productCode')}",
            "is_outdoor": is_pet_friendly,
            "tags": product.get("tags", []),
            "source": "viator"
        })
    
    return attractions


async def get_pet_friendly_attractions(city: str, limit: int = 5) -> Dict[str, Any]:
    """
    Get pet-friendly attractions and experiences in a city.
    Focuses on outdoor activities, nature tours, parks, beaches.
    """
    attractions = await search_attractions(
        destination=city,
        query="outdoor nature park tour",
        pet_friendly=True,
        limit=limit
    )
    
    # Filter for outdoor/pet-friendly attractions
    pet_friendly = [a for a in attractions if a.get("is_outdoor")]
    
    # If not enough pet-friendly, include top-rated ones
    if len(pet_friendly) < 3:
        pet_friendly = attractions[:limit]
    
    return {
        "success": True,
        "city": city,
        "type": "pet_friendly_attractions",
        "attractions": pet_friendly,
        "total": len(pet_friendly),
        "note": "These attractions are typically outdoor/nature-based. Always confirm pet policy before booking."
    }


async def get_day_trips(city: str, limit: int = 5) -> Dict[str, Any]:
    """Get day trips and tours from a city."""
    attractions = await search_attractions(
        destination=city,
        query="day trip tour excursion",
        pet_friendly=False,  # All day trips
        limit=limit
    )
    
    return {
        "success": True,
        "city": city,
        "type": "day_trips",
        "attractions": attractions,
        "total": len(attractions)
    }


async def get_nature_experiences(city: str, limit: int = 5) -> Dict[str, Any]:
    """Get nature and wildlife experiences."""
    attractions = await search_attractions(
        destination=city,
        query="nature wildlife safari hiking trekking",
        pet_friendly=True,
        limit=limit
    )
    
    return {
        "success": True,
        "city": city,
        "type": "nature_experiences",
        "attractions": attractions,
        "total": len(attractions)
    }


async def get_travel_experiences_for_pet(
    pet_name: str,
    pet_breed: str,
    destination: str,
    activity_level: str = "moderate"  # low, moderate, high
) -> Dict[str, Any]:
    """
    Get personalized travel experiences considering the pet.
    
    Args:
        pet_name: Pet's name
        pet_breed: Pet's breed
        destination: Travel destination
        activity_level: Pet's activity level
        
    Returns:
        Personalized attraction recommendations
    """
    # Determine query based on breed/activity
    query = "outdoor nature"
    
    # High energy breeds need more active activities
    high_energy_breeds = ["retriever", "labrador", "husky", "shepherd", "border collie", "beagle"]
    low_energy_breeds = ["bulldog", "pug", "shih tzu", "maltese", "pomeranian"]
    
    breed_lower = pet_breed.lower()
    
    if any(b in breed_lower for b in high_energy_breeds) or activity_level == "high":
        query = "hiking trekking adventure outdoor"
        activity_note = f"{pet_name} will love these active adventures!"
    elif any(b in breed_lower for b in low_energy_breeds) or activity_level == "low":
        query = "scenic tour sightseeing garden"
        activity_note = f"Gentle activities perfect for {pet_name}!"
    else:
        query = "nature park beach outdoor tour"
        activity_note = f"Great experiences for you and {pet_name}!"
    
    attractions = await search_attractions(
        destination=destination,
        query=query,
        pet_friendly=True,
        limit=5
    )
    
    # Travel tips based on breed
    travel_tips = [
        f"🐕 Always carry water and a portable bowl for {pet_name}",
        "📋 Check pet policies before visiting attractions",
        "🚗 Take regular breaks during travel for bathroom and stretching",
    ]
    
    if any(b in breed_lower for b in ["bulldog", "pug", "boxer", "shih tzu"]):
        travel_tips.append(f"⚠️ {pet_name} is a brachycephalic breed - avoid hot hours and ensure good ventilation")
    
    if any(b in breed_lower for b in ["husky", "malamute", "bernese"]):
        travel_tips.append(f"❄️ {pet_name} has a heavy coat - carry cooling mats and avoid peak heat")
    
    return {
        "success": True,
        "pet_name": pet_name,
        "pet_breed": pet_breed,
        "destination": destination,
        "activity_note": activity_note,
        "attractions": attractions,
        "total": len(attractions),
        "travel_tips": travel_tips
    }


def get_supported_destinations() -> List[str]:
    """Get list of supported destinations."""
    return list(INDIA_DESTINATIONS.keys())


async def test_viator_connection():
    """Test if Viator API is working."""
    if not VIATOR_API_KEY:
        return {"success": False, "error": "API key not configured", "fallback_available": True}
    
    try:
        attractions = await search_attractions(
            destination="mumbai",
            query="tour",
            pet_friendly=False,
            limit=2
        )
        if attractions:
            return {
                "success": True,
                "results_count": len(attractions),
                "sample": attractions[0] if attractions else None
            }
        else:
            return {
                "success": False,
                "error": "API returned no results - using fallback data",
                "fallback_available": True
            }
    except Exception as e:
        return {"success": False, "error": str(e), "fallback_available": True}


# ═══════════════════════════════════════════════════════════════════════════════
# FALLBACK DATA - Pet-friendly attractions when API is unavailable
# ═══════════════════════════════════════════════════════════════════════════════

FALLBACK_ATTRACTIONS = {
    "mumbai": [
        {
            "id": "va-1",
            "title": "Sanjay Gandhi National Park Safari",
            "description": "Explore India's most visited national park with wildlife spotting and nature trails. Perfect for outdoor adventures with your pet.",
            "image_url": "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=300",
            "rating": 4.6,
            "review_count": 2340,
            "price_from": 500,
            "currency": "INR",
            "duration": "3h",
            "destination": "Mumbai",
            "is_outdoor": True,
            "source": "curated"
        },
        {
            "id": "va-2",
            "title": "Marine Drive Sunset Walk",
            "description": "Experience Mumbai's iconic Queen's Necklace with a guided evening walk. Dog-friendly and scenic.",
            "rating": 4.8,
            "review_count": 1890,
            "price_from": 300,
            "currency": "INR",
            "duration": "2h",
            "destination": "Mumbai",
            "is_outdoor": True,
            "source": "curated"
        },
        {
            "id": "va-3",
            "title": "Alibaug Beach Day Trip",
            "description": "Escape to pet-friendly beaches just 2 hours from Mumbai. Includes ferry ride and beach activities.",
            "rating": 4.5,
            "review_count": 1560,
            "price_from": 1500,
            "currency": "INR",
            "duration": "8h",
            "destination": "Mumbai",
            "is_outdoor": True,
            "source": "curated"
        }
    ],
    "goa": [
        {
            "id": "va-4",
            "title": "Palolem Beach Pet Day",
            "description": "Spend a day at Goa's most pet-friendly beach with calm waters and shaded areas.",
            "rating": 4.7,
            "review_count": 890,
            "price_from": 0,
            "currency": "INR",
            "duration": "Full day",
            "destination": "Goa",
            "is_outdoor": True,
            "source": "curated"
        },
        {
            "id": "va-5",
            "title": "Dudhsagar Falls Trek",
            "description": "Adventure trek to one of India's tallest waterfalls through lush greenery.",
            "rating": 4.6,
            "review_count": 2100,
            "price_from": 2500,
            "currency": "INR",
            "duration": "10h",
            "destination": "Goa",
            "is_outdoor": True,
            "source": "curated"
        }
    ],
    "bangalore": [
        {
            "id": "va-6",
            "title": "Nandi Hills Sunrise Trek",
            "description": "Early morning trek to see spectacular sunrise views. Popular with pet parents.",
            "rating": 4.5,
            "review_count": 3200,
            "price_from": 800,
            "currency": "INR",
            "duration": "5h",
            "destination": "Bangalore",
            "is_outdoor": True,
            "source": "curated"
        },
        {
            "id": "va-7",
            "title": "Bannerghatta Nature Walk",
            "description": "Guided nature walk through Bannerghatta biological park's outer trails.",
            "rating": 4.4,
            "review_count": 1450,
            "price_from": 600,
            "currency": "INR",
            "duration": "3h",
            "destination": "Bangalore",
            "is_outdoor": True,
            "source": "curated"
        }
    ],
    "delhi": [
        {
            "id": "va-8",
            "title": "Lodhi Garden Heritage Walk",
            "description": "Explore historic Lodhi Garden with your pet - one of Delhi's most pet-friendly green spaces.",
            "rating": 4.7,
            "review_count": 2800,
            "price_from": 400,
            "currency": "INR",
            "duration": "2h",
            "destination": "Delhi",
            "is_outdoor": True,
            "source": "curated"
        }
    ]
}


async def get_pet_friendly_attractions_with_fallback(city: str, limit: int = 5) -> Dict[str, Any]:
    """Get pet-friendly attractions with fallback data."""
    # Try API first
    result = await get_pet_friendly_attractions(city, limit)
    
    if result.get("attractions"):
        return result
    
    # Use fallback
    city_lower = city.lower().strip()
    fallback = FALLBACK_ATTRACTIONS.get(city_lower, FALLBACK_ATTRACTIONS.get("mumbai", []))
    
    return {
        "success": True,
        "city": city,
        "type": "pet_friendly_attractions",
        "attractions": fallback[:limit],
        "total": len(fallback[:limit]),
        "source": "curated_fallback",
        "note": "These are curated pet-friendly attractions. Always confirm pet policy before visiting."
    }
