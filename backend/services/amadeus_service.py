"""
Amadeus Travel API Service
Provides pet-friendly hotel search and travel recommendations
"""

import httpx
import logging
from typing import Optional, Dict, List, Any
import os
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

# Amadeus API Configuration
AMADEUS_API_KEY = os.environ.get("AMADEUS_API_KEY", "")
AMADEUS_API_SECRET = os.environ.get("AMADEUS_API_SECRET", "")
AMADEUS_AUTH_URL = "https://test.api.amadeus.com/v1/security/oauth2/token"
AMADEUS_API_URL = "https://test.api.amadeus.com"

# Cache for access token
_access_token = None
_token_expiry = None


async def get_access_token() -> Optional[str]:
    """
    Get Amadeus API access token (with caching).
    
    Returns:
        Access token string or None
    """
    global _access_token, _token_expiry
    
    # Check if we have a valid cached token
    if _access_token and _token_expiry and datetime.now() < _token_expiry:
        return _access_token
    
    if not AMADEUS_API_KEY or not AMADEUS_API_SECRET:
        logger.warning("Amadeus API credentials not configured")
        return None
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                AMADEUS_AUTH_URL,
                data={
                    "grant_type": "client_credentials",
                    "client_id": AMADEUS_API_KEY,
                    "client_secret": AMADEUS_API_SECRET
                },
                headers={"Content-Type": "application/x-www-form-urlencoded"},
                timeout=10.0
            )
            
            if response.status_code != 200:
                logger.error(f"Amadeus auth error: {response.status_code} - {response.text}")
                return None
            
            data = response.json()
            _access_token = data.get("access_token")
            expires_in = data.get("expires_in", 1800)  # Default 30 minutes
            _token_expiry = datetime.now() + timedelta(seconds=expires_in - 60)  # 1 min buffer
            
            return _access_token
            
    except Exception as e:
        logger.error(f"Amadeus auth error: {e}")
        return None


async def search_hotels_by_city(
    city_code: str,
    check_in: str = None,
    check_out: str = None,
    adults: int = 2,
    radius: int = 50,
    max_results: int = 10
) -> List[Dict[str, Any]]:
    """
    Search for hotels in a city.
    
    Args:
        city_code: IATA city code (e.g., "BOM" for Mumbai, "DEL" for Delhi)
        check_in: Check-in date (YYYY-MM-DD)
        check_out: Check-out date (YYYY-MM-DD)
        adults: Number of adults
        radius: Search radius in km
        max_results: Maximum results
        
    Returns:
        List of hotel dictionaries
    """
    token = await get_access_token()
    if not token:
        return []
    
    # Default dates if not provided
    if not check_in:
        check_in = (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d")
    if not check_out:
        check_out = (datetime.now() + timedelta(days=9)).strftime("%Y-%m-%d")
    
    try:
        async with httpx.AsyncClient() as client:
            # First, get hotel list for the city
            response = await client.get(
                f"{AMADEUS_API_URL}/v1/reference-data/locations/hotels/by-city",
                params={
                    "cityCode": city_code,
                    "radius": radius,
                    "radiusUnit": "KM",
                    "hotelSource": "ALL"
                },
                headers={
                    "Authorization": f"Bearer {token}"
                },
                timeout=15.0
            )
            
            if response.status_code != 200:
                logger.error(f"Amadeus hotel search error: {response.status_code}")
                return []
            
            data = response.json()
            hotels = data.get("data", [])[:max_results]
            
            return _process_hotel_response(hotels)
            
    except Exception as e:
        logger.error(f"Amadeus hotel search error: {e}")
        return []


def _process_hotel_response(hotels: List[Dict]) -> List[Dict[str, Any]]:
    """Process Amadeus hotel response into standardized format."""
    processed = []
    
    for hotel in hotels:
        processed.append({
            "id": hotel.get("hotelId", ""),
            "name": hotel.get("name", "Unknown Hotel"),
            "chain_code": hotel.get("chainCode"),
            "iata_code": hotel.get("iataCode"),
            "latitude": hotel.get("geoCode", {}).get("latitude"),
            "longitude": hotel.get("geoCode", {}).get("longitude"),
            "address": hotel.get("address", {}).get("lines", [""])[0] if hotel.get("address", {}).get("lines") else "",
            "city": hotel.get("address", {}).get("cityName", ""),
            "country": hotel.get("address", {}).get("countryCode", ""),
            "distance": hotel.get("distance", {}).get("value"),
            "distance_unit": hotel.get("distance", {}).get("unit", "KM"),
            "source": "amadeus"
        })
    
    return processed


# City code mapping for India
INDIA_CITY_CODES = {
    "mumbai": "BOM",
    "delhi": "DEL",
    "bangalore": "BLR",
    "bengaluru": "BLR",
    "chennai": "MAA",
    "kolkata": "CCU",
    "hyderabad": "HYD",
    "pune": "PNQ",
    "goa": "GOI",
    "jaipur": "JAI",
    "ahmedabad": "AMD",
    "kochi": "COK",
    "gurgaon": "DEL",
    "noida": "DEL",
    "udaipur": "UDR",
    "jodhpur": "JDH",
    "agra": "AGR",
    "varanasi": "VNS",
    "shimla": "SLV",
    "manali": "KUU",
    "rishikesh": "DED",
    "mussoorie": "DED",
    "ooty": "CBE",
    "coorg": "IXE",
    "munnar": "COK"
}


def get_city_code(city_name: str) -> Optional[str]:
    """Get IATA city code from city name."""
    city_lower = city_name.lower().strip()
    return INDIA_CITY_CODES.get(city_lower)


async def search_pet_friendly_hotels(
    city: str,
    check_in: str = None,
    check_out: str = None,
    max_results: int = 10
) -> Dict[str, Any]:
    """
    Search for pet-friendly hotels in a city.
    
    Note: Amadeus doesn't have a direct pet-friendly filter, so we return
    hotels and note which ones are typically pet-friendly based on chain.
    
    Args:
        city: City name
        check_in: Check-in date
        check_out: Check-out date
        max_results: Maximum results
        
    Returns:
        Dictionary with hotels and pet-friendly info
    """
    city_code = get_city_code(city)
    
    if not city_code:
        return {
            "success": False,
            "error": f"City code not found for '{city}'. Try major cities like Mumbai, Delhi, Bangalore, Goa."
        }
    
    hotels = await search_hotels_by_city(
        city_code=city_code,
        check_in=check_in,
        check_out=check_out,
        max_results=max_results
    )
    
    # Pet-friendly hotel chains (typically allow pets)
    PET_FRIENDLY_CHAINS = ["HI", "IH", "MC", "HY", "WI", "SI", "RT", "RA", "BW"]
    
    # Mark pet-friendly likelihood
    for hotel in hotels:
        chain = hotel.get("chain_code", "")
        hotel["pet_friendly_likelihood"] = "high" if chain in PET_FRIENDLY_CHAINS else "check_with_hotel"
        hotel["pet_policy_note"] = "This chain typically accepts pets. Call to confirm specific policies and fees." if chain in PET_FRIENDLY_CHAINS else "Contact hotel directly to inquire about pet policy."
    
    return {
        "success": True,
        "city": city,
        "city_code": city_code,
        "check_in": check_in,
        "check_out": check_out,
        "hotels": hotels,
        "total": len(hotels),
        "note": "Pet policies vary by property. Always call ahead to confirm pet acceptance and any fees."
    }


async def get_travel_recommendations_for_pet(
    pet_name: str,
    pet_breed: str,
    destination_city: str,
    travel_dates: Dict[str, str] = None
) -> Dict[str, Any]:
    """
    Get personalized travel recommendations for traveling with a pet.
    
    Args:
        pet_name: Pet's name
        pet_breed: Pet's breed
        destination_city: Destination city
        travel_dates: Dict with "check_in" and "check_out"
        
    Returns:
        Comprehensive travel recommendations
    """
    # Get hotels
    check_in = travel_dates.get("check_in") if travel_dates else None
    check_out = travel_dates.get("check_out") if travel_dates else None
    
    hotel_result = await search_pet_friendly_hotels(
        city=destination_city,
        check_in=check_in,
        check_out=check_out,
        max_results=5
    )
    
    # Generate pet-specific travel tips
    travel_tips = [
        f"🐕 Carry {pet_name}'s vaccination records and health certificate",
        "📋 Pack familiar items: favorite toy, blanket, food bowl",
        "💧 Bring bottled water for the journey to avoid tummy upsets",
        "🚗 Take breaks every 2-3 hours for bathroom and stretching",
        "🏥 Research emergency vet clinics at your destination"
    ]
    
    # Breed-specific tips
    breed_lower = pet_breed.lower()
    if any(b in breed_lower for b in ["bulldog", "pug", "shih tzu", "boxer"]):
        travel_tips.append("⚠️ Brachycephalic breeds: Avoid hot hours, ensure good ventilation")
    elif any(b in breed_lower for b in ["husky", "malamute", "bernese"]):
        travel_tips.append("❄️ Heavy-coated breeds: Carry cooling mats, avoid peak heat")
    elif any(b in breed_lower for b in ["golden", "labrador", "retriever"]):
        travel_tips.append("🏊 Retrievers love water: Look for hotels with pools or nearby lakes")
    
    return {
        "success": True,
        "pet_name": pet_name,
        "pet_breed": pet_breed,
        "destination": destination_city,
        "hotels": hotel_result.get("hotels", []),
        "total_hotels": hotel_result.get("total", 0),
        "travel_tips": travel_tips,
        "message": f"Travel recommendations for {pet_name} to {destination_city}"
    }


# Test function
async def test_amadeus_connection():
    """Test if Amadeus API is working."""
    if not AMADEUS_API_KEY or not AMADEUS_API_SECRET:
        return {"success": False, "error": "API credentials not configured"}
    
    try:
        token = await get_access_token()
        if token:
            return {
                "success": True,
                "message": "Amadeus API connected successfully",
                "token_preview": token[:20] + "..."
            }
        return {"success": False, "error": "Failed to get access token"}
    except Exception as e:
        return {"success": False, "error": str(e)}
