"""
Nearby Places Routes - Google Places API integration for location-based services
Provides endpoints for finding nearby vets, pet stores, groomers, etc.

Created: March 12, 2026
"""

from fastapi import APIRouter, Query, HTTPException
from typing import Optional
import httpx
import os
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/nearby", tags=["nearby-places"])

# Also create a nearme router for CareNearMe component
nearme_router = APIRouter(prefix="/api/nearme", tags=["nearme"])

GOOGLE_PLACES_API_KEY = os.environ.get("GOOGLE_PLACES_API_KEY", "")
GOOGLE_PLACES_API_URL = "https://places.googleapis.com/v1"

# Place type mappings for different service categories
PLACE_TYPE_MAPPINGS = {
    "veterinary_care": ["veterinary_care"],
    "pet_store": ["pet_store"],
    "dog_trainer": ["pet_store"],  # Search by keyword instead
    "pet_groomer": ["pet_store"],  # Search by keyword instead
    "boarding": ["pet_store"],     # Search by keyword instead
}


@router.get("/places")
async def search_nearby_places(
    lat: float = Query(..., description="Latitude"),
    lng: float = Query(..., description="Longitude"),
    type: str = Query("pet_store", description="Google Place type"),
    keyword: Optional[str] = Query(None, description="Search keyword"),
    radius: int = Query(10000, description="Search radius in meters", ge=500, le=50000)
):
    """
    Search for nearby places using Google Places API.
    Used by NearbyAdoptServices and other location-based components.
    """
    if not GOOGLE_PLACES_API_KEY:
        raise HTTPException(status_code=500, detail="Google Places API not configured")
    
    try:
        # Use text search for better keyword matching
        if keyword:
            return await _text_search_places(lat, lng, keyword, radius)
        else:
            return await _nearby_search_places(lat, lng, type, radius)
    except Exception as e:
        logger.error(f"Error in nearby places search: {e}")
        raise HTTPException(status_code=500, detail=str(e))


async def _text_search_places(lat: float, lng: float, keyword: str, radius: int):
    """Text-based search for better keyword matching"""
    
    request_body = {
        "textQuery": keyword,
        "maxResultCount": 10,
        "locationBias": {
            "circle": {
                "center": {"latitude": lat, "longitude": lng},
                "radius": float(radius)
            }
        },
        "languageCode": "en"
    }
    
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
        "places.location",
        "places.photos"
    ])
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{GOOGLE_PLACES_API_URL}/places:searchText",
            json=request_body,
            headers={
                "Content-Type": "application/json",
                "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY,
                "X-Goog-FieldMask": field_mask
            },
            timeout=15.0
        )
        
        if response.status_code != 200:
            logger.error(f"Google Places API error: {response.status_code} - {response.text}")
            return {"places": [], "error": "Search failed"}
        
        data = response.json()
        places = _process_places_response(data)
        
        return {"places": places, "total": len(places)}


async def _nearby_search_places(lat: float, lng: float, place_type: str, radius: int):
    """Nearby search for place types"""
    
    included_types = PLACE_TYPE_MAPPINGS.get(place_type, [place_type])
    
    request_body = {
        "includedTypes": included_types,
        "maxResultCount": 10,
        "locationRestriction": {
            "circle": {
                "center": {"latitude": lat, "longitude": lng},
                "radius": float(radius)
            }
        },
        "languageCode": "en"
    }
    
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
        "places.location",
        "places.photos"
    ])
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{GOOGLE_PLACES_API_URL}/places:searchNearby",
            json=request_body,
            headers={
                "Content-Type": "application/json",
                "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY,
                "X-Goog-FieldMask": field_mask
            },
            timeout=15.0
        )
        
        if response.status_code != 200:
            logger.error(f"Google Places API error: {response.status_code} - {response.text}")
            return {"places": [], "error": "Search failed"}
        
        data = response.json()
        places = _process_places_response(data)
        
        return {"places": places, "total": len(places)}


def _process_places_response(data: dict) -> list:
    """Process Google Places API response into clean format"""
    places = []
    
    for place in data.get("places", []):
        # Get photo URL if available
        photo_url = None
        if place.get("photos"):
            photo_name = place["photos"][0].get("name")
            if photo_name:
                photo_url = f"https://places.googleapis.com/v1/{photo_name}/media?maxHeightPx=300&maxWidthPx=400&key={GOOGLE_PLACES_API_KEY}"
        
        # Parse opening hours
        is_open_now = None
        opening_hours = None
        if place.get("currentOpeningHours"):
            is_open_now = place["currentOpeningHours"].get("openNow")
            weekday_text = place["currentOpeningHours"].get("weekdayDescriptions", [])
            opening_hours = weekday_text
        
        processed = {
            "id": place.get("id"),
            "name": place.get("displayName", {}).get("text", "Unknown"),
            "address": place.get("formattedAddress", ""),
            "phone": place.get("nationalPhoneNumber") or place.get("internationalPhoneNumber"),
            "rating": place.get("rating"),
            "total_ratings": place.get("userRatingCount", 0),
            "website": place.get("websiteUri"),
            "is_open_now": is_open_now,
            "opening_hours": opening_hours,
            "status": place.get("businessStatus", "OPERATIONAL"),
            "photo_url": photo_url,
            "location": {
                "lat": place.get("location", {}).get("latitude"),
                "lng": place.get("location", {}).get("longitude")
            }
        }
        
        places.append(processed)
    
    # Sort by rating (descending)
    places.sort(key=lambda x: (x.get("rating") or 0), reverse=True)
    
    return places


@nearme_router.get("/search")
async def nearme_search(
    query: str = Query(..., description="Search query like 'pet grooming salon Hyderabad'"),
    type: str = Query("care", description="Pillar type")
):
    """
    Text-based NearMe search used by CareNearMe component.
    Returns results with fields matching the frontend expectations.
    """
    if not GOOGLE_PLACES_API_KEY:
        raise HTTPException(status_code=500, detail="Google Places API not configured")

    try:
        request_body = {
            "textQuery": query,
            "maxResultCount": 15,
            "languageCode": "en"
        }

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
            "places.location",
            "places.photos"
        ])

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{GOOGLE_PLACES_API_URL}/places:searchText",
                json=request_body,
                headers={
                    "Content-Type": "application/json",
                    "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY,
                    "X-Goog-FieldMask": field_mask
                },
                timeout=15.0
            )

            if response.status_code != 200:
                logger.error(f"NearMe search error: {response.status_code} - {response.text}")
                return {"results": [], "places": []}

            data = response.json()
            raw_places = _process_places_response(data)

            # Map to the format CareNearMe expects
            results = []
            for p in raw_places:
                results.append({
                    "name": p["name"],
                    "formatted_address": p["address"],
                    "vicinity": p["address"],
                    "rating": p.get("rating"),
                    "user_ratings_total": p.get("total_ratings", 0),
                    "formatted_phone_number": p.get("phone"),
                    "website": p.get("website"),
                    "opening_hours": {"open_now": p.get("is_open_now")} if p.get("is_open_now") is not None else None,
                    "photo_url": p.get("photo_url"),
                    "geometry": {"location": p.get("location", {})},
                })

            return {"results": results, "places": results, "total": len(results)}

    except Exception as e:
        logger.error(f"NearMe search error: {e}")
        return {"results": [], "places": []}
