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


# City code mapping - WORLDWIDE support with country codes for accuracy
# Format: city_name: (IATA_code, country_code)
CITY_CODES_WITH_COUNTRY = {
    # India
    "mumbai": ("BOM", "IN"), "delhi": ("DEL", "IN"), "bangalore": ("BLR", "IN"), "bengaluru": ("BLR", "IN"),
    "chennai": ("MAA", "IN"), "kolkata": ("CCU", "IN"), "hyderabad": ("HYD", "IN"), "pune": ("PNQ", "IN"),
    "goa": ("GOI", "IN"), "jaipur": ("JAI", "IN"), "ahmedabad": ("AMD", "IN"), "kochi": ("COK", "IN"),
    "gurgaon": ("DEL", "IN"), "noida": ("DEL", "IN"), "udaipur": ("UDR", "IN"), "jodhpur": ("JDH", "IN"),
    "agra": ("AGR", "IN"), "varanasi": ("VNS", "IN"), "shimla": ("SLV", "IN"), "manali": ("KUU", "IN"),
    "rishikesh": ("DED", "IN"), "mussoorie": ("DED", "IN"), "ooty": ("CJB", "IN"), "coorg": ("IXE", "IN"),
    "munnar": ("COK", "IN"), "darjeeling": ("IXB", "IN"), "gangtok": ("IXB", "IN"), "leh": ("IXL", "IN"),
    "srinagar": ("SXR", "IN"), "amritsar": ("ATQ", "IN"), "chandigarh": ("IXC", "IN"), "lucknow": ("LKO", "IN"),
    "indore": ("IDR", "IN"), "bhopal": ("BHO", "IN"), "nagpur": ("NAG", "IN"), "thiruvananthapuram": ("TRV", "IN"),
    "trivandrum": ("TRV", "IN"), "mysore": ("MYQ", "IN"), "vizag": ("VTZ", "IN"), "visakhapatnam": ("VTZ", "IN"),
    "coimbatore": ("CJB", "IN"),
    
    # Europe
    "london": ("LON", "GB"), "paris": ("PAR", "FR"), "rome": ("ROM", "IT"), "barcelona": ("BCN", "ES"),
    "madrid": ("MAD", "ES"), "amsterdam": ("AMS", "NL"), "berlin": ("BER", "DE"), "munich": ("MUC", "DE"),
    "vienna": ("VIE", "AT"), "prague": ("PRG", "CZ"), "budapest": ("BUD", "HU"), "lisbon": ("LIS", "PT"),
    "athens": ("ATH", "GR"), "dublin": ("DUB", "IE"), "zurich": ("ZRH", "CH"), "geneva": ("GVA", "CH"),
    "milan": ("MIL", "IT"), "venice": ("VCE", "IT"), "florence": ("FLR", "IT"), "nice": ("NCE", "FR"),
    "brussels": ("BRU", "BE"), "copenhagen": ("CPH", "DK"), "stockholm": ("STO", "SE"), "oslo": ("OSL", "NO"),
    "helsinki": ("HEL", "FI"), "warsaw": ("WAW", "PL"), "krakow": ("KRK", "PL"), "edinburgh": ("EDI", "GB"),
    "manchester": ("MAN", "GB"), "birmingham": ("BHX", "GB"), "frankfurt": ("FRA", "DE"),
    
    # Asia Pacific
    "singapore": ("SIN", "SG"), "bangkok": ("BKK", "TH"), "kuala lumpur": ("KUL", "MY"), "tokyo": ("TYO", "JP"),
    "osaka": ("OSA", "JP"), "kyoto": ("KIX", "JP"), "seoul": ("SEL", "KR"), "hong kong": ("HKG", "HK"),
    "taipei": ("TPE", "TW"), "manila": ("MNL", "PH"), "jakarta": ("JKT", "ID"), "bali": ("DPS", "ID"),
    "phuket": ("HKT", "TH"), "hanoi": ("HAN", "VN"), "ho chi minh": ("SGN", "VN"), "saigon": ("SGN", "VN"),
    "beijing": ("BJS", "CN"), "shanghai": ("SHA", "CN"), "guangzhou": ("CAN", "CN"), "shenzhen": ("SZX", "CN"),
    "sydney": ("SYD", "AU"), "melbourne": ("MEL", "AU"), "brisbane": ("BNE", "AU"), "perth": ("PER", "AU"),
    "auckland": ("AKL", "NZ"), "wellington": ("WLG", "NZ"), "fiji": ("SUV", "FJ"),
    
    # Middle East
    "dubai": ("DXB", "AE"), "abu dhabi": ("AUH", "AE"), "doha": ("DOH", "QA"), "muscat": ("MCT", "OM"),
    "bahrain": ("BAH", "BH"), "kuwait": ("KWI", "KW"), "riyadh": ("RUH", "SA"), "jeddah": ("JED", "SA"),
    "amman": ("AMM", "JO"), "beirut": ("BEY", "LB"), "tel aviv": ("TLV", "IL"), "istanbul": ("IST", "TR"),
    
    # Africa
    "cairo": ("CAI", "EG"), "johannesburg": ("JNB", "ZA"), "cape town": ("CPT", "ZA"), "nairobi": ("NBO", "KE"),
    "casablanca": ("CMN", "MA"), "marrakech": ("RAK", "MA"), "mauritius": ("MRU", "MU"), "seychelles": ("SEZ", "SC"),
    "zanzibar": ("ZNZ", "TZ"), "lagos": ("LOS", "NG"), "accra": ("ACC", "GH"),
    
    # Americas
    "new york": ("NYC", "US"), "los angeles": ("LAX", "US"), "san francisco": ("SFO", "US"), "chicago": ("CHI", "US"),
    "miami": ("MIA", "US"), "las vegas": ("LAS", "US"), "boston": ("BOS", "US"), "seattle": ("SEA", "US"),
    "washington": ("WAS", "US"), "denver": ("DEN", "US"), "dallas": ("DFW", "US"), "houston": ("HOU", "US"),
    "toronto": ("YTO", "CA"), "vancouver": ("YVR", "CA"), "montreal": ("YMQ", "CA"), "cancun": ("CUN", "MX"),
    "mexico city": ("MEX", "MX"), "sao paulo": ("SAO", "BR"), "rio de janeiro": ("RIO", "BR"), "lima": ("LIM", "PE"),
    "bogota": ("BOG", "CO"), "buenos aires": ("BUE", "AR"), "santiago": ("SCL", "CL"),
    
    # UK specific
    "uk": ("LON", "GB"), "england": ("LON", "GB"), "britain": ("LON", "GB"),
}

# Legacy simple mapping for backward compatibility
CITY_CODES = {k: v[0] for k, v in CITY_CODES_WITH_COUNTRY.items()}

# Keep backward compatibility
INDIA_CITY_CODES = {k: v[0] for k, v in CITY_CODES_WITH_COUNTRY.items() if v[1] == "IN"}


def get_city_code(city_name: str) -> Optional[str]:
    """Get IATA city code from city name. Supports worldwide cities."""
    city_lower = city_name.lower().strip()
    
    # Direct lookup
    if city_lower in CITY_CODES:
        return CITY_CODES[city_lower]
    
    # Try partial match (for "New York City" -> "new york")
    for city, code in CITY_CODES.items():
        if city in city_lower or city_lower in city:
            return code
    
    # For unknown cities, return None - the caller should handle gracefully
    return None


def get_city_code_and_country(city_name: str) -> tuple:
    """Get IATA city code and country code from city name."""
    city_lower = city_name.lower().strip()
    
    # Direct lookup
    if city_lower in CITY_CODES_WITH_COUNTRY:
        return CITY_CODES_WITH_COUNTRY[city_lower]
    
    # Try partial match
    for city, (code, country) in CITY_CODES_WITH_COUNTRY.items():
        if city in city_lower or city_lower in city:
            return (code, country)
    
    return (None, None)
    return None


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
        logger.info(f"City code not found for '{city}', will try Google Places or Viator instead")
        return {
            "success": False,
            "error": f"Amadeus doesn't have '{city}' in database. Try using Google Places for local search.",
            "city": city,
            "hotels": []
        }
    
    hotels = await search_hotels_by_city(
        city_code=city_code,
        check_in=check_in,
        check_out=check_out,
        max_results=max_results
    )
    
    # Pet-friendly hotel chains (typically allow pets)
    PET_FRIENDLY_CHAINS = ["HI", "IH", "MC", "HY", "WI", "SI", "RT", "RA", "BW"]
    
    # Mark pet-friendly likelihood - Concierge-friendly messaging
    for hotel in hotels:
        chain = hotel.get("chain_code", "")
        hotel["pet_friendly_likelihood"] = "high" if chain in PET_FRIENDLY_CHAINS else "verify"
        # Remove "contact hotel" - Concierge handles everything
        hotel["pet_policy_note"] = "Pet Friendly" if chain in PET_FRIENDLY_CHAINS else ""
    
    return {
        "success": True,
        "city": city,
        "city_code": city_code,
        "check_in": check_in,
        "check_out": check_out,
        "hotels": hotels,
        "total": len(hotels),
        "note": "Our Concierge® team will verify pet policies and handle all bookings for you."
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
