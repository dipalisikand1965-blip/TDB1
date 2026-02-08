"""
Google Maps Directions API Service
Provides navigation to vets, parks, and pet-friendly places
"""

import httpx
import logging
from typing import Optional, Dict, Any, List
import os

logger = logging.getLogger(__name__)

# Google Maps API Configuration
GOOGLE_MAPS_API_KEY = os.environ.get("GOOGLE_PLACES_API_KEY", "")  # Same key works for Maps
GOOGLE_DIRECTIONS_URL = "https://maps.googleapis.com/maps/api/directions/json"
GOOGLE_DISTANCE_URL = "https://maps.googleapis.com/maps/api/distancematrix/json"


async def get_directions(
    origin: str,
    destination: str,
    mode: str = "driving",  # driving, walking, transit
    avoid: str = None  # tolls, highways, ferries
) -> Optional[Dict[str, Any]]:
    """
    Get directions from origin to destination.
    
    Args:
        origin: Starting location (address or lat,lng)
        destination: End location (address or lat,lng)
        mode: Travel mode (driving, walking, transit)
        avoid: Features to avoid
        
    Returns:
        Directions data dictionary
    """
    if not GOOGLE_MAPS_API_KEY:
        logger.warning("Google Maps API key not configured")
        return None
    
    params = {
        "origin": origin,
        "destination": destination,
        "mode": mode,
        "key": GOOGLE_MAPS_API_KEY,
        "region": "in"  # India
    }
    
    if avoid:
        params["avoid"] = avoid
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                GOOGLE_DIRECTIONS_URL,
                params=params,
                timeout=10.0
            )
            
            if response.status_code != 200:
                logger.error(f"Google Directions API error: {response.status_code}")
                return None
            
            data = response.json()
            
            if data.get("status") != "OK":
                logger.error(f"Google Directions error: {data.get('status')}")
                return None
            
            return _process_directions_response(data, mode)
            
    except Exception as e:
        logger.error(f"Google Directions API error: {e}")
        return None


async def get_distance_matrix(
    origins: List[str],
    destinations: List[str],
    mode: str = "driving"
) -> Optional[Dict[str, Any]]:
    """
    Get distances and travel times between multiple origins and destinations.
    
    Args:
        origins: List of origin addresses
        destinations: List of destination addresses
        mode: Travel mode
        
    Returns:
        Distance matrix data
    """
    if not GOOGLE_MAPS_API_KEY:
        logger.warning("Google Maps API key not configured")
        return None
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                GOOGLE_DISTANCE_URL,
                params={
                    "origins": "|".join(origins),
                    "destinations": "|".join(destinations),
                    "mode": mode,
                    "key": GOOGLE_MAPS_API_KEY,
                    "region": "in"
                },
                timeout=10.0
            )
            
            if response.status_code != 200:
                logger.error(f"Google Distance Matrix API error: {response.status_code}")
                return None
            
            data = response.json()
            
            if data.get("status") != "OK":
                logger.error(f"Google Distance Matrix error: {data.get('status')}")
                return None
            
            return _process_distance_matrix(data)
            
    except Exception as e:
        logger.error(f"Google Distance Matrix API error: {e}")
        return None


def _process_directions_response(data: Dict[str, Any], mode: str) -> Dict[str, Any]:
    """Process Google Directions API response."""
    route = data.get("routes", [{}])[0]
    leg = route.get("legs", [{}])[0]
    
    # Extract step-by-step directions
    steps = []
    for step in leg.get("steps", []):
        # Clean HTML from instructions
        instruction = step.get("html_instructions", "")
        instruction = instruction.replace("<b>", "").replace("</b>", "")
        instruction = instruction.replace("<div style=\"font-size:0.9em\">", " - ")
        instruction = instruction.replace("</div>", "")
        
        steps.append({
            "instruction": instruction,
            "distance": step.get("distance", {}).get("text"),
            "duration": step.get("duration", {}).get("text"),
            "travel_mode": step.get("travel_mode")
        })
    
    # Generate pet-friendly tips based on mode
    pet_tips = []
    if mode == "driving":
        pet_tips = [
            "🚗 Secure your pet with a harness or carrier",
            "🌡️ Never leave pets in parked cars",
            "💧 Bring water for the journey",
            "🛑 Take breaks for longer trips"
        ]
    elif mode == "walking":
        pet_tips = [
            "🦮 Keep your dog on leash",
            "💧 Carry water for your pet",
            "🐾 Check paw pads on hot days",
            "🎒 Bring waste bags"
        ]
    elif mode == "transit":
        pet_tips = [
            "📋 Check if pets are allowed on this transit",
            "🐕 Use a carrier for small pets",
            "⏰ Avoid peak hours if possible",
            "🎫 Some transit requires pet tickets"
        ]
    
    return {
        "origin": leg.get("start_address"),
        "destination": leg.get("end_address"),
        "distance": leg.get("distance", {}).get("text"),
        "duration": leg.get("duration", {}).get("text"),
        "duration_in_traffic": leg.get("duration_in_traffic", {}).get("text"),
        "mode": mode,
        "steps": steps,
        "steps_count": len(steps),
        "summary": route.get("summary"),
        "warnings": route.get("warnings", []),
        "pet_tips": pet_tips,
        "maps_url": f"https://www.google.com/maps/dir/?api=1&origin={leg.get('start_address')}&destination={leg.get('end_address')}&travelmode={mode}"
    }


def _process_distance_matrix(data: Dict[str, Any]) -> Dict[str, Any]:
    """Process Google Distance Matrix API response."""
    origins = data.get("origin_addresses", [])
    destinations = data.get("destination_addresses", [])
    
    results = []
    for i, row in enumerate(data.get("rows", [])):
        for j, element in enumerate(row.get("elements", [])):
            if element.get("status") == "OK":
                results.append({
                    "origin": origins[i] if i < len(origins) else "Unknown",
                    "destination": destinations[j] if j < len(destinations) else "Unknown",
                    "distance": element.get("distance", {}).get("text"),
                    "distance_meters": element.get("distance", {}).get("value"),
                    "duration": element.get("duration", {}).get("text"),
                    "duration_seconds": element.get("duration", {}).get("value")
                })
    
    # Sort by distance
    results.sort(key=lambda x: x.get("distance_meters", float("inf")))
    
    return {
        "results": results,
        "nearest": results[0] if results else None
    }


async def get_directions_to_nearest_vet(
    user_location: str,
    city: str,
    emergency: bool = False
) -> Dict[str, Any]:
    """
    Get directions to the nearest vet clinic.
    
    Args:
        user_location: User's address or area
        city: City name
        emergency: If True, prioritize 24/7 emergency vets
        
    Returns:
        Directions to nearest vet with details
    """
    # Import here to avoid circular imports
    from services.google_places_service import search_vets_in_city
    
    # Find vets in the city
    vets = await search_vets_in_city(city, max_results=5)
    
    if not vets:
        return {"success": False, "error": "No vet clinics found in your area"}
    
    # If emergency, prioritize 24/7 clinics
    if emergency:
        emergency_vets = [v for v in vets if v.get("is_24_hours")]
        if emergency_vets:
            vets = emergency_vets
    
    # Get the nearest vet
    nearest_vet = vets[0]
    
    # Get directions
    origin = f"{user_location}, {city}, India"
    destination = nearest_vet.get("address") or nearest_vet.get("name")
    
    directions = await get_directions(origin, destination, mode="driving")
    
    if not directions:
        # Return vet info without directions
        return {
            "success": True,
            "vet": nearest_vet,
            "directions": None,
            "message": f"Found {nearest_vet.get('name')} but couldn't calculate directions"
        }
    
    return {
        "success": True,
        "vet": nearest_vet,
        "directions": directions,
        "is_emergency": emergency,
        "message": f"Nearest {'24/7 emergency ' if emergency else ''}vet: {nearest_vet.get('name')} - {directions.get('duration')} away"
    }


async def get_directions_to_place(
    user_location: str,
    place_name: str,
    place_address: str,
    mode: str = "driving"
) -> Dict[str, Any]:
    """
    Get directions to a specific pet-friendly place.
    
    Args:
        user_location: User's starting location
        place_name: Name of the destination
        place_address: Address of the destination
        mode: Travel mode
        
    Returns:
        Directions with pet tips
    """
    directions = await get_directions(
        origin=user_location,
        destination=place_address,
        mode=mode
    )
    
    if not directions:
        return {
            "success": False,
            "error": f"Could not find directions to {place_name}"
        }
    
    return {
        "success": True,
        "place_name": place_name,
        "directions": directions,
        "message": f"Directions to {place_name}: {directions.get('duration')} ({directions.get('distance')})"
    }


# Test function
async def test_directions_api():
    """Test if Google Directions API is working."""
    if not GOOGLE_MAPS_API_KEY:
        return {"success": False, "error": "API key not configured"}
    
    try:
        result = await get_directions(
            origin="Bandra, Mumbai",
            destination="Vetic Animal Hospital, Andheri, Mumbai",
            mode="driving"
        )
        return {
            "success": result is not None,
            "sample": {
                "duration": result.get("duration") if result else None,
                "distance": result.get("distance") if result else None
            }
        }
    except Exception as e:
        return {"success": False, "error": str(e)}
