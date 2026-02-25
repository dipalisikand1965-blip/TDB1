"""
Location-Aware Concierge Service
Fetches real nearby venues using Google Places API and combines with curated picks.
"""

import logging
import httpx
import os
from typing import Dict, List, Optional, Any
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

GOOGLE_PLACES_API_KEY = os.environ.get("GOOGLE_PLACES_API_KEY", "")
GOOGLE_PLACES_API_URL = "https://places.googleapis.com/v1"


async def search_nearby_pet_friendly(
    latitude: float,
    longitude: float,
    category: str,
    radius_meters: int = 5000,
    max_results: int = 5
) -> List[Dict[str, Any]]:
    """
    Search for pet-friendly places near user's location.
    
    Categories:
    - restaurant: Pet-friendly restaurants and cafes
    - bakery: Pet bakeries for cakes/treats
    - groomer: Pet groomers and spas
    - park: Dog parks and outdoor spaces
    - vet: Veterinary clinics
    - photographer: Pet photography studios
    - party_venue: Event venues that allow pets
    """
    if not GOOGLE_PLACES_API_KEY:
        logger.warning("[LOCATION] Google Places API key not configured")
        return []
    
    # Map categories to search queries and place types
    category_config = {
        "restaurant": {
            "query": "pet friendly restaurant cafe",
            "types": ["restaurant", "cafe"],
            "keywords": ["pet friendly", "dog friendly"]
        },
        "bakery": {
            "query": "pet bakery dog treats cake",
            "types": ["bakery", "pet_store"],
            "keywords": ["pet", "dog", "cake"]
        },
        "groomer": {
            "query": "pet grooming dog spa",
            "types": ["pet_store"],
            "keywords": ["grooming", "spa"]
        },
        "park": {
            "query": "dog park pet park",
            "types": ["park"],
            "keywords": ["dog", "pet"]
        },
        "vet": {
            "query": "veterinary clinic pet hospital",
            "types": ["veterinary_care"],
            "keywords": []
        },
        "photographer": {
            "query": "pet photography dog photography studio",
            "types": ["photographer"],
            "keywords": ["pet", "dog"]
        },
        "party_venue": {
            "query": "pet friendly event venue party hall",
            "types": ["event_venue"],
            "keywords": ["pet friendly"]
        }
    }
    
    config = category_config.get(category, category_config["restaurant"])
    
    try:
        # Use text search with location bias for better pet-specific results
        request_body = {
            "textQuery": config["query"],
            "pageSize": min(max_results, 10),
            "locationBias": {
                "circle": {
                    "center": {
                        "latitude": latitude,
                        "longitude": longitude
                    },
                    "radius": float(radius_meters)
                }
            },
            "languageCode": "en"
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
            "places.location",
            "places.priceLevel"
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
                timeout=10.0
            )
            
            if response.status_code != 200:
                logger.error(f"[LOCATION] Google Places error: {response.status_code}")
                return []
            
            data = response.json()
            places = data.get("places", [])
            
            results = []
            for place in places[:max_results]:
                # Calculate distance from user
                place_loc = place.get("location", {})
                distance_km = _calculate_distance(
                    latitude, longitude,
                    place_loc.get("latitude", 0),
                    place_loc.get("longitude", 0)
                )
                
                results.append({
                    "id": place.get("id"),
                    "name": place.get("displayName", {}).get("text", "Unknown"),
                    "address": place.get("formattedAddress", ""),
                    "phone": place.get("nationalPhoneNumber"),
                    "rating": place.get("rating"),
                    "review_count": place.get("userRatingCount", 0),
                    "website": place.get("websiteUri"),
                    "is_open": _is_place_open(place.get("currentOpeningHours")),
                    "distance_km": round(distance_km, 1),
                    "price_level": place.get("priceLevel"),
                    "category": category
                })
            
            logger.info(f"[LOCATION] Found {len(results)} {category} places near ({latitude}, {longitude})")
            return results
            
    except Exception as e:
        logger.error(f"[LOCATION] Error searching places: {e}")
        return []


def _calculate_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance between two coordinates in kilometers using Haversine formula."""
    import math
    
    R = 6371  # Earth's radius in km
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    
    a = math.sin(delta_lat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon/2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
    
    return R * c


def _is_place_open(opening_hours: Optional[Dict]) -> Optional[bool]:
    """Check if place is currently open."""
    if not opening_hours:
        return None
    return opening_hours.get("openNow")


# ============================================
# DINE PILLAR - Location-Aware Suggestions
# ============================================

async def get_dine_location_suggestions(
    latitude: float,
    longitude: float,
    city: str,
    pet_traits: List[str] = None
) -> Dict[str, Any]:
    """
    Get location-aware dining suggestions for a pet.
    
    Returns:
    - nearby_restaurants: Real pet-friendly restaurants from Google
    - nearby_cafes: Pet-friendly cafes
    - nearby_parks: Parks good for picnics
    - suggestions: Personalized suggestions based on pet traits
    """
    pet_traits = pet_traits or []
    
    # Fetch real nearby places
    restaurants = await search_nearby_pet_friendly(latitude, longitude, "restaurant", radius_meters=5000, max_results=3)
    parks = await search_nearby_pet_friendly(latitude, longitude, "park", radius_meters=3000, max_results=2)
    
    # Generate personalized suggestions based on pet traits
    suggestions = []
    
    if "social" in pet_traits or "playful" in pet_traits:
        suggestions.append({
            "type": "recommendation",
            "title": "Outdoor Dining Adventure",
            "description": f"Your social pup would love the outdoor seating at pet-friendly spots in {city}",
            "why": "Perfect for pets who love people-watching and making friends"
        })
    
    if "anxious" in pet_traits or "calm" in pet_traits:
        suggestions.append({
            "type": "recommendation", 
            "title": "Quiet Corner Dining",
            "description": f"We'll find you a peaceful spot with minimal foot traffic in {city}",
            "why": "Ideal for sensitive pets who prefer calm environments"
        })
    
    if "foodie" in pet_traits:
        suggestions.append({
            "type": "recommendation",
            "title": "Gourmet Pet Menu Experience",
            "description": "Restaurants with special pet menus and treats",
            "why": "Because your foodie deserves their own dining experience"
        })
    
    return {
        "nearby_restaurants": restaurants,
        "nearby_parks": parks,
        "city": city,
        "suggestions": suggestions,
        "search_radius_km": 5
    }


# ============================================
# CELEBRATE PILLAR - Location-Aware Suggestions  
# ============================================

async def get_celebrate_location_suggestions(
    latitude: float,
    longitude: float,
    city: str,
    pet_traits: List[str] = None,
    event_type: str = None
) -> Dict[str, Any]:
    """
    Get location-aware celebration suggestions for a pet.
    
    Returns:
    - nearby_bakeries: Pet bakeries for cakes
    - nearby_venues: Party-friendly venues
    - nearby_photographers: Pet photographers
    - suggestions: Personalized suggestions
    """
    pet_traits = pet_traits or []
    event_type = event_type or "birthday"
    
    # Fetch real nearby places
    bakeries = await search_nearby_pet_friendly(latitude, longitude, "bakery", radius_meters=10000, max_results=3)
    parks = await search_nearby_pet_friendly(latitude, longitude, "park", radius_meters=5000, max_results=2)
    
    # Generate personalized suggestions
    suggestions = []
    
    if event_type == "birthday":
        suggestions.append({
            "type": "recommendation",
            "title": f"Birthday Party in {city}",
            "description": "We can arrange a pet-friendly birthday bash with local vendors",
            "services": ["Custom cake", "Photo session", "Venue booking"]
        })
    
    if "social" in pet_traits:
        suggestions.append({
            "type": "recommendation",
            "title": "Puppy Playdate Party",
            "description": f"Invite furry friends for a group celebration at a {city} dog park",
            "why": "Your social butterfly will love having all their friends around"
        })
    
    if "anxious" in pet_traits or "calm" in pet_traits:
        suggestions.append({
            "type": "recommendation",
            "title": "Intimate Home Celebration",
            "description": "We'll bring the party to you - cake, decorations, photographer",
            "why": "Keeps your pet comfortable in their safe space"
        })
    
    if "elegant" in pet_traits or "pampered" in pet_traits:
        suggestions.append({
            "type": "recommendation",
            "title": "VIP Spa Day Celebration",
            "description": f"A luxurious grooming session + photoshoot in {city}",
            "why": "Because royalty deserves a royal celebration"
        })
    
    return {
        "nearby_bakeries": bakeries,
        "nearby_parks": parks,
        "city": city,
        "event_type": event_type,
        "suggestions": suggestions,
        "delivery_available": True  # Most bakeries deliver
    }


# ============================================
# GENERIC LOCATION ENRICHMENT
# ============================================

def enrich_card_with_location(
    card: Dict[str, Any],
    user_location: Dict[str, Any],
    nearby_places: List[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Enrich a concierge card with location-specific data.
    
    Adds:
    - city badge
    - nearby venue (if applicable)
    - distance info
    - delivery availability
    """
    city = user_location.get("city", "your area") if user_location else "your area"
    
    # Add location badge
    card["location_badge"] = city
    card["serves_location"] = True
    
    # If there are nearby places and this is a service card, attach the closest one
    if nearby_places and card.get("type") == "concierge_service":
        closest = nearby_places[0] if nearby_places else None
        if closest:
            card["nearby_venue"] = {
                "name": closest.get("name"),
                "distance_km": closest.get("distance_km"),
                "rating": closest.get("rating"),
                "is_open": closest.get("is_open")
            }
    
    return card
