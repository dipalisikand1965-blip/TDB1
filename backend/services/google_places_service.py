"""
Google Places API Service
Provides real-time place search for vets, restaurants, dog parks, pet stores
"""

import httpx
import logging
from typing import Optional, Dict, List, Any
import os
from datetime import datetime, timezone

logger = logging.getLogger(__name__)


# Google Places API Configuration
GOOGLE_PLACES_API_KEY = os.environ.get("GOOGLE_PLACES_API_KEY", "")
GOOGLE_PLACES_API_URL = "https://places.googleapis.com/v1"


# Place type mappings for pet-related searches
PET_PLACE_TYPES = {
    "vet": ["veterinary_care"],
    "restaurant": ["restaurant"],
    "dog_park": ["park"],
    "pet_store": ["pet_store"],
    "groomer": ["pet_store"],  # Groomers often categorized under pet_store
}


async def geocode_city(city_name: str) -> Optional[Dict[str, float]]:
    """
    Convert city name to latitude/longitude coordinates using Google Geocoding.
    
    Args:
        city_name: Name of the city (e.g., "Mumbai, India")
        
    Returns:
        Dict with latitude and longitude, or None if not found
    """
    if not GOOGLE_PLACES_API_KEY:
        logger.warning("Google Places API key not configured")
        return None
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://maps.googleapis.com/maps/api/geocode/json",
                params={
                    "address": city_name,  # Works worldwide without ", India" suffix
                    "key": GOOGLE_PLACES_API_KEY
                },
                timeout=10.0
            )
            
            if response.status_code != 200:
                logger.error(f"Geocoding error: {response.status_code}")
                return None
            
            data = response.json()
            
            if data.get("status") == "OK" and data.get("results"):
                location = data["results"][0]["geometry"]["location"]
                return {
                    "latitude": location["lat"],
                    "longitude": location["lng"]
                }
            
            return None
            
    except Exception as e:
        logger.error(f"Geocoding error: {e}")
        return None


async def search_nearby_places_google(
    latitude: float,
    longitude: float,
    place_type: str,
    radius_meters: int = 5000,
    max_results: int = 5,
    language: str = "en"
) -> List[Dict[str, Any]]:
    """
    Search for places near a location using Google Places API (New).
    
    Args:
        latitude: Latitude coordinate
        longitude: Longitude coordinate
        place_type: Type of place (vet, restaurant, dog_park, pet_store)
        radius_meters: Search radius in meters
        max_results: Maximum results to return
        language: Language code for results
        
    Returns:
        List of place dictionaries with details
    """
    if not GOOGLE_PLACES_API_KEY:
        logger.warning("Google Places API key not configured")
        return []
    
    place_types = PET_PLACE_TYPES.get(place_type, ["point_of_interest"])
    
    request_body = {
        "includedTypes": place_types,
        "maxResultCount": min(max_results, 20),
        "locationRestriction": {
            "circle": {
                "center": {
                    "latitude": latitude,
                    "longitude": longitude
                },
                "radius": radius_meters
            }
        },
        "languageCode": language
    }
    
    # Field mask for required data
    field_mask = ",".join([
        "places.id",
        "places.displayName",
        "places.formattedAddress",
        "places.nationalPhoneNumber",
        "places.internationalPhoneNumber",
        "places.rating",
        "places.userRatingCount",
        "places.websiteUri",
        "places.currentOpeningHours",
        "places.businessStatus",
        "places.types",
        "places.primaryType",
        "places.location"
    ])
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{GOOGLE_PLACES_API_URL}/places:searchNearby",
                json=request_body,
                headers={
                    "Content-Type": "application/json",
                    "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY,
                    "X-Goog-FieldMask": field_mask
                },
                timeout=10.0
            )
            
            if response.status_code != 200:
                logger.error(f"Google Places API error: {response.status_code} - {response.text}")
                return []
            
            data = response.json()
            return _process_google_places_response(data, place_type)
            
    except httpx.TimeoutException:
        logger.error("Google Places API request timed out")
        return []
    except Exception as e:
        logger.error(f"Error searching Google Places: {e}")
        return []


async def search_places_by_text(
    query: str,
    max_results: int = 10,
    language: str = "en"
) -> List[Dict[str, Any]]:
    """
    Search for places using a text query.
    
    Args:
        query: Text query (e.g., "veterinary clinics in Mumbai")
        max_results: Maximum results to return
        language: Language code
        
    Returns:
        List of place dictionaries
    """
    if not GOOGLE_PLACES_API_KEY:
        logger.warning("Google Places API key not configured")
        return []
    
    request_body = {
        "textQuery": query,
        "pageSize": min(max_results, 20),
        "languageCode": language
    }
    
    field_mask = ",".join([
        "places.id",
        "places.displayName",
        "places.formattedAddress",
        "places.nationalPhoneNumber",
        "places.rating",
        "places.userRatingCount",
        "places.websiteUri",
        "places.currentOpeningHours",
        "places.businessStatus",
        "places.types",
        "places.location"
    ])
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{GOOGLE_PLACES_API_URL}/places:searchText",
                json=request_body,
                headers={
                    "Content-Type": "application/json",
                    "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY,
                    "X-Goog-FieldMask": field_mask
                },
                timeout=10.0
            )
            
            if response.status_code != 200:
                logger.error(f"Google Places text search error: {response.status_code}")
                return []
            
            data = response.json()
            return _process_google_places_response(data)
            
    except Exception as e:
        logger.error(f"Error in Google Places text search: {e}")
        return []


def _process_google_places_response(
    api_response: Dict[str, Any],
    place_type: str = "general"
) -> List[Dict[str, Any]]:
    """
    Process Google Places API response into standardized format.
    
    Args:
        api_response: Raw API response
        place_type: Type of place for categorization
        
    Returns:
        List of processed place dictionaries
    """
    places = []
    raw_places = api_response.get("places", [])
    
    for place_data in raw_places:
        try:
            display_name = place_data.get("displayName", {})
            location = place_data.get("location", {})
            opening_hours = place_data.get("currentOpeningHours", {})
            
            # Determine if open now
            is_open_now = opening_hours.get("openNow", None)
            
            # Get opening hours description
            hours_description = None
            if opening_hours.get("weekdayDescriptions"):
                hours_description = opening_hours["weekdayDescriptions"]
            
            place = {
                "id": place_data.get("id", ""),
                "name": display_name.get("text", "Unknown"),
                "address": place_data.get("formattedAddress", ""),
                "phone": place_data.get("nationalPhoneNumber") or place_data.get("internationalPhoneNumber"),
                "rating": place_data.get("rating"),
                "reviews_count": place_data.get("userRatingCount"),
                "website": place_data.get("websiteUri"),
                "is_open_now": is_open_now,
                "opening_hours": hours_description,
                "business_status": place_data.get("businessStatus", "OPERATIONAL"),
                "types": place_data.get("types", []),
                "primary_type": place_data.get("primaryType"),
                "latitude": location.get("latitude"),
                "longitude": location.get("longitude"),
                "source": "google_places",
                "verified": True,  # Google Places data is verified
                "place_type": place_type
            }
            
            # Add special flags for vet clinics
            if place_type == "vet":
                place["is_emergency"] = "emergency" in place.get("name", "").lower()
                # Check for 24/7 in name or opening hours
                place["is_24_hours"] = "24" in place.get("name", "").lower() or (
                    hours_description and any("24" in h for h in hours_description)
                )
            
            places.append(place)
            
        except Exception as e:
            logger.warning(f"Error parsing Google place data: {e}")
            continue
    
    return places


async def search_vets_in_city(city: str, max_results: int = 10) -> List[Dict[str, Any]]:
    """
    Search for veterinary clinics in a city.
    
    Args:
        city: City name
        max_results: Maximum results
        
    Returns:
        List of vet clinics
    """
    # First geocode the city
    coords = await geocode_city(city)
    
    if coords:
        # Use nearby search with coordinates
        return await search_nearby_places_google(
            latitude=coords["latitude"],
            longitude=coords["longitude"],
            place_type="vet",
            radius_meters=10000,  # 10km radius
            max_results=max_results
        )
    else:
        # Fall back to text search
        return await search_places_by_text(
            query=f"veterinary clinic hospital in {city}, India",
            max_results=max_results
        )


async def search_dog_parks_in_city(city: str, max_results: int = 10) -> List[Dict[str, Any]]:
    """
    Search for dog parks in a city.
    
    Args:
        city: City name
        max_results: Maximum results
        
    Returns:
        List of dog parks
    """
    coords = await geocode_city(city)
    
    if coords:
        return await search_nearby_places_google(
            latitude=coords["latitude"],
            longitude=coords["longitude"],
            place_type="dog_park",
            radius_meters=15000,  # 15km radius for parks
            max_results=max_results
        )
    else:
        return await search_places_by_text(
            query=f"dog park pet park in {city}, India",
            max_results=max_results
        )


async def search_pet_stores_in_city(city: str, max_results: int = 10) -> List[Dict[str, Any]]:
    """
    Search for pet stores/groomers in a city.
    
    Args:
        city: City name
        max_results: Maximum results
        
    Returns:
        List of pet stores
    """
    coords = await geocode_city(city)
    
    if coords:
        return await search_nearby_places_google(
            latitude=coords["latitude"],
            longitude=coords["longitude"],
            place_type="pet_store",
            radius_meters=10000,
            max_results=max_results
        )
    else:
        return await search_places_by_text(
            query=f"pet store groomer in {city}, India",
            max_results=max_results
        )


# Quick test function
async def test_google_places_connection():
    """Test if Google Places API is working."""
    if not GOOGLE_PLACES_API_KEY:
        return {"success": False, "error": "API key not configured"}
    
    try:
        results = await search_vets_in_city("Mumbai", max_results=2)
        return {
            "success": True,
            "results_count": len(results),
            "sample": results[0] if results else None
        }
    except Exception as e:
        return {"success": False, "error": str(e)}
