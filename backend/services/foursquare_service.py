"""
Foursquare Places API Service
Provides richer venue data including photos, ratings, reviews, and hours
"""

import httpx
import logging
from typing import Optional, Dict, List, Any
import os

logger = logging.getLogger(__name__)

# Foursquare API Configuration
FOURSQUARE_API_KEY = os.environ.get("FOURSQUARE_API_KEY", "")
FOURSQUARE_API_URL = "https://api.foursquare.com/v3"

# Pet-friendly venue categories
PET_FRIENDLY_CATEGORIES = {
    "pet_stores": "17069",  # Pet Store
    "veterinary": "15057",  # Veterinarian
    "dog_parks": "16032",   # Dog Run
    "parks": "16032,16009", # Parks and Playgrounds
    "cafes": "13034,13035", # Cafes, Coffee Shops
    "restaurants": "13065", # Restaurants
    "hotels": "19014",      # Hotels
    "groomers": "11134",    # Pet Groomer
}


async def search_places(
    query: str = None,
    latitude: float = None,
    longitude: float = None,
    city: str = None,
    categories: str = None,
    limit: int = 10,
    radius: int = 5000,
    open_now: bool = None
) -> List[Dict[str, Any]]:
    """
    Search for places using Foursquare API.
    
    Args:
        query: Search query (e.g., "pet cafe", "dog park")
        latitude: Latitude for location-based search
        longitude: Longitude for location-based search
        city: City name (will be geocoded)
        categories: Foursquare category IDs
        limit: Maximum results
        radius: Search radius in meters
        open_now: Filter for currently open places
        
    Returns:
        List of place dictionaries
    """
    if not FOURSQUARE_API_KEY:
        logger.warning("Foursquare API key not configured")
        return []
    
    # City coordinates for India
    CITY_COORDS = {
        "mumbai": {"lat": 19.0760, "lon": 72.8777},
        "delhi": {"lat": 28.6139, "lon": 77.2090},
        "bangalore": {"lat": 12.9716, "lon": 77.5946},
        "bengaluru": {"lat": 12.9716, "lon": 77.5946},
        "chennai": {"lat": 13.0827, "lon": 80.2707},
        "kolkata": {"lat": 22.5726, "lon": 88.3639},
        "hyderabad": {"lat": 17.3850, "lon": 78.4867},
        "pune": {"lat": 18.5204, "lon": 73.8567},
        "goa": {"lat": 15.2993, "lon": 74.1240},
        "jaipur": {"lat": 26.9124, "lon": 75.7873},
        "ahmedabad": {"lat": 23.0225, "lon": 72.5714},
        "kochi": {"lat": 9.9312, "lon": 76.2673},
    }
    
    # Get coordinates
    if city and not (latitude and longitude):
        city_lower = city.lower().strip()
        if city_lower in CITY_COORDS:
            latitude = CITY_COORDS[city_lower]["lat"]
            longitude = CITY_COORDS[city_lower]["lon"]
    
    if not (latitude and longitude):
        latitude = 19.0760  # Default to Mumbai
        longitude = 72.8777
    
    try:
        headers = {
            "Authorization": FOURSQUARE_API_KEY,
            "Accept": "application/json"
        }
        
        params = {
            "ll": f"{latitude},{longitude}",
            "limit": limit,
            "radius": radius,
            "fields": "fsq_id,name,location,categories,rating,photos,hours,tel,website,description,tips,popularity"
        }
        
        if query:
            params["query"] = query
        if categories:
            params["categories"] = categories
        if open_now:
            params["open_now"] = "true"
        
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{FOURSQUARE_API_URL}/places/search",
                headers=headers,
                params=params,
                timeout=15.0
            )
            
            if response.status_code != 200:
                logger.error(f"Foursquare API error: {response.status_code} - {response.text}")
                return []
            
            data = response.json()
            return _process_foursquare_response(data.get("results", []), city)
            
    except Exception as e:
        logger.error(f"Foursquare search error: {e}")
        return []


def _process_foursquare_response(results: List[Dict], city: str = None) -> List[Dict[str, Any]]:
    """Process Foursquare API response into standardized format."""
    places = []
    
    for place in results:
        # Build photo URL if available
        photo_url = None
        photos = place.get("photos", [])
        if photos:
            photo = photos[0]
            photo_url = f"{photo.get('prefix')}300x300{photo.get('suffix')}"
        
        # Get primary category
        categories = place.get("categories", [])
        primary_category = categories[0].get("name") if categories else "Place"
        
        # Get location details
        location = place.get("location", {})
        
        # Get hours
        hours = place.get("hours", {})
        is_open_now = hours.get("open_now", None)
        
        # Get tips/reviews
        tips = place.get("tips", [])
        top_tip = tips[0].get("text") if tips else None
        
        places.append({
            "id": place.get("fsq_id"),
            "name": place.get("name"),
            "address": location.get("formatted_address") or location.get("address"),
            "city": city or location.get("locality"),
            "area": location.get("neighborhood") or location.get("cross_street"),
            "latitude": location.get("lat"),
            "longitude": location.get("lng"),
            "category": primary_category,
            "rating": place.get("rating"),
            "photo_url": photo_url,
            "phone": place.get("tel"),
            "website": place.get("website"),
            "description": place.get("description"),
            "is_open_now": is_open_now,
            "hours_display": hours.get("display"),
            "popularity": place.get("popularity"),
            "top_review": top_tip,
            "source": "foursquare"
        })
    
    return places


async def get_pet_friendly_cafes(city: str, limit: int = 5) -> Dict[str, Any]:
    """Get pet-friendly cafes in a city."""
    places = await search_places(
        query="pet friendly cafe",
        city=city,
        categories=PET_FRIENDLY_CATEGORIES["cafes"],
        limit=limit
    )
    
    return {
        "success": True,
        "city": city,
        "type": "pet_cafes",
        "places": places,
        "total": len(places)
    }


async def get_pet_stores(city: str, limit: int = 5) -> Dict[str, Any]:
    """Get pet stores in a city."""
    places = await search_places(
        query="pet store",
        city=city,
        categories=PET_FRIENDLY_CATEGORIES["pet_stores"],
        limit=limit
    )
    
    return {
        "success": True,
        "city": city,
        "type": "pet_stores",
        "places": places,
        "total": len(places)
    }


async def get_dog_parks(city: str, limit: int = 5) -> Dict[str, Any]:
    """Get dog parks and pet-friendly parks."""
    places = await search_places(
        query="dog park",
        city=city,
        categories=PET_FRIENDLY_CATEGORIES["dog_parks"],
        limit=limit
    )
    
    return {
        "success": True,
        "city": city,
        "type": "dog_parks",
        "places": places,
        "total": len(places)
    }


async def get_pet_groomers(city: str, limit: int = 5) -> Dict[str, Any]:
    """Get pet groomers in a city."""
    places = await search_places(
        query="pet grooming",
        city=city,
        categories=PET_FRIENDLY_CATEGORIES["groomers"],
        limit=limit
    )
    
    return {
        "success": True,
        "city": city,
        "type": "pet_groomers",
        "places": places,
        "total": len(places)
    }


async def enrich_venue_data(venue_name: str, city: str) -> Dict[str, Any]:
    """
    Enrich existing venue data with Foursquare details.
    Use this to add photos, ratings, hours to venues from other sources.
    """
    places = await search_places(
        query=venue_name,
        city=city,
        limit=1
    )
    
    if places:
        return {
            "success": True,
            "enriched_data": places[0]
        }
    
    return {
        "success": False,
        "error": "Venue not found in Foursquare"
    }


async def test_foursquare_connection():
    """Test if Foursquare API is working."""
    if not FOURSQUARE_API_KEY:
        return {"success": False, "error": "API key not configured"}
    
    try:
        places = await search_places(query="cafe", city="mumbai", limit=2)
        return {
            "success": len(places) > 0,
            "results_count": len(places),
            "sample": places[0] if places else None
        }
    except Exception as e:
        return {"success": False, "error": str(e)}
